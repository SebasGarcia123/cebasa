import { randomUUID } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { EstadosLookupService } from '../../../prisma/estados-lookup.service.js';
import { PlantaLookupService } from '../../../prisma/planta-lookup.service.js';
import { UPLOADS_DIR } from '../../compras/archivo-adjunto/archivo-adjunto.storage.js';
import { RemitoPdfService } from './remito-pdf.service.js';
import { CreatePedidoDto } from './dto/create-pedido.dto.js';
import { UpdatePedidoDto } from './dto/update-pedido.dto.js';
import { AnularPedidoDto } from './dto/anular-pedido.dto.js';
import { DespacharPedidoDto } from './dto/despachar-pedido.dto.js';

const ESTADO_PENDIENTE = 'Pendiente';
const ESTADO_FACTURADO = 'Facturado';
const ESTADO_DESPACHADO = 'Despachado';
const ESTADO_ANULADO = 'Anulado';
const ESTADO_ACTIVO = 'Activo';
const TIPO_MOVIMIENTO_DESPACHO = 'Despacho a cliente';

@Injectable()
export class PedidosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly estadosLookup: EstadosLookupService,
    private readonly plantaLookup: PlantaLookupService,
    private readonly remitoPdfService: RemitoPdfService,
  ) {}

  // Un cliente cancelado no puede recibir pedidos nuevos.
  private async assertClienteActivo(idCliente: number): Promise<void> {
    const cliente = await this.prisma.clientes.findUnique({
      where: { id_cliente: idCliente },
      include: { estados: true },
    });
    if (cliente?.estados.nombreEstado === 'Cancelado') {
      throw new BadRequestException('No se pueden cargar pedidos a un cliente cancelado');
    }
  }

  async create(dto: CreatePedidoDto) {
    await this.assertClienteActivo(dto.id_cliente);
    const idEstadoPendiente = await this.estadosLookup.getId(ESTADO_PENDIENTE);
    return this.prisma.pedidos.create({
      data: {
        ...dto,
        id_estado: idEstadoPendiente,
        fecha_carga: new Date(dto.fecha_carga),
        fecha_prometido: dto.fecha_prometido
          ? new Date(dto.fecha_prometido)
          : undefined,
      },
    });
  }

  findAll() {
    return this.prisma.pedidos.findMany({
      include: { clientes: true, estados: true, deposito: true },
    });
  }

  async findOne(id: number) {
    const pedido = await this.prisma.pedidos.findUnique({
      where: { id_pedido: id },
      include: {
        clientes: { include: { direcciones: true } },
        estados: true,
        usuarios: true,
        deposito: true,
        item_pedido: { include: { productos: { include: { tipo_producto: true } } } },
      },
    });
    if (!pedido) {
      throw new NotFoundException(`Pedido ${id} no encontrado`);
    }
    return pedido;
  }

  // El pedido solo se edita (header o ítems) mientras está "Pendiente":
  // una vez facturado, se asume que lo que dice el pedido ya se
  // trasladó a otros comprobantes y no se puede tocar en silencio.
  async assertEditable(id: number): Promise<void> {
    const pedido = await this.findOne(id);
    if (pedido.estados.nombreEstado !== ESTADO_PENDIENTE) {
      throw new BadRequestException('Un pedido solo se puede editar mientras está Pendiente');
    }
  }

  async update(id: number, dto: UpdatePedidoDto) {
    await this.assertEditable(id);
    if (dto.id_cliente !== undefined) {
      await this.assertClienteActivo(dto.id_cliente);
    }
    return this.prisma.pedidos.update({
      where: { id_pedido: id },
      data: {
        ...dto,
        fecha_carga: dto.fecha_carga ? new Date(dto.fecha_carga) : undefined,
        fecha_prometido: dto.fecha_prometido
          ? new Date(dto.fecha_prometido)
          : undefined,
      },
    });
  }

  async remove(id: number) {
    await this.assertEditable(id);
    return this.prisma.pedidos.delete({ where: { id_pedido: id } });
  }

  // Logística (o quien tenga el permiso) marca el pedido como
  // facturado: recién ahí se puede despachar.
  async facturar(id: number) {
    const pedido = await this.findOne(id);
    if (pedido.estados.nombreEstado !== ESTADO_PENDIENTE) {
      throw new BadRequestException('Solo se puede facturar un pedido Pendiente');
    }
    const idEstadoFacturado = await this.estadosLookup.getId(ESTADO_FACTURADO);
    return this.prisma.pedidos.update({
      where: { id_pedido: id },
      data: { id_estado: idEstadoFacturado },
    });
  }

  // Anular: motivo si estaba Pendiente, nro de nota de débito si ya
  // estaba Facturado (la nota de débito en sí se emite por fuera del
  // sistema por ahora, acá solo queda la referencia).
  async anular(id: number, dto: AnularPedidoDto) {
    const pedido = await this.findOne(id);
    const idEstadoAnulado = await this.estadosLookup.getId(ESTADO_ANULADO);

    if (pedido.estados.nombreEstado === ESTADO_PENDIENTE) {
      if (!dto.motivo) {
        throw new BadRequestException('Hace falta un motivo para anular un pedido Pendiente');
      }
      return this.prisma.pedidos.update({
        where: { id_pedido: id },
        data: { id_estado: idEstadoAnulado, motivo_anulacion: dto.motivo },
      });
    }

    if (pedido.estados.nombreEstado === ESTADO_FACTURADO) {
      if (!dto.nro_nota_debito) {
        throw new BadRequestException('Hace falta el número de nota de débito para anular un pedido Facturado');
      }
      return this.prisma.pedidos.update({
        where: { id_pedido: id },
        data: { id_estado: idEstadoAnulado, nro_nota_debito: dto.nro_nota_debito },
      });
    }

    throw new BadRequestException('Solo se puede anular un pedido Pendiente o Facturado');
  }

  // Mensaje fijo para que el frontend lo reconozca y, en vez de mostrar
  // el error sin más, le ofrezca a quien despacha elegir el depósito a
  // mano (ver DespachoPedidosList en el frontend).
  static readonly DEPOSITO_NO_RESUELTO =
    'No se pudo determinar el depósito de logística automáticamente. Elegilo manualmente.';

  // Resuelve el depósito de logística del usuario que despacha, según
  // el sector al que pertenece ("Logística Baradero"/"Logística
  // Caseros", o sus variantes "Operario de..."): busca en el nombre
  // del sector "Baradero" o "Caseros" y lo cruza con el depósito de
  // logística de esa misma localidad. Devuelve null si no se puede
  // resolver (ej. un administrador sin sector real asignado), en vez
  // de tirar error directamente: quien llama decide si hay un
  // id_deposito elegido a mano como respaldo.
  private async resolverDepositoDeUsuario(idUsuario: number): Promise<number | null> {
    const usuario = await this.prisma.usuarios.findUnique({
      where: { id_usuario: idUsuario },
      include: { sectores: true },
    });
    const planta = usuario ? this.plantaLookup.plantaDeSector(usuario.sectores.nombreSector) : null;
    if (!planta) {
      return null;
    }

    const depositos = await this.prisma.deposito.findMany();
    const deposito = depositos.find(
      (d) => d.nombre_deposito.toLowerCase().includes('log') && this.plantaLookup.plantaDeDeposito(d.nombre_deposito) === planta,
    );
    return deposito?.id_deposito ?? null;
  }

  // Combina la resolución automática con el id_deposito que se haya
  // elegido a mano (solo se usa como respaldo cuando la automática no
  // pudo determinar nada), validando que sea un depósito de logística real.
  private async resolverDepositoParaDespacho(idUsuario: number, idDepositoElegido?: number): Promise<number> {
    const automatico = await this.resolverDepositoDeUsuario(idUsuario);
    if (automatico) {
      return automatico;
    }
    if (idDepositoElegido) {
      const deposito = await this.prisma.deposito.findUnique({ where: { id_deposito: idDepositoElegido } });
      if (!deposito || !deposito.nombre_deposito.toLowerCase().includes('log')) {
        throw new BadRequestException('Elegí un depósito de logística válido');
      }
      return deposito.id_deposito;
    }
    throw new BadRequestException(PedidosService.DEPOSITO_NO_RESUELTO);
  }

  // Despacha el pedido: descuenta stock del depósito de logística que
  // corresponde al usuario, deja un movimiento de producto por ítem, y
  // genera el remito en PDF (se guarda como archivo_adjunto para poder
  // reimprimirlo después con GET /pedidos/:id/remito).
  async despachar(id: number, dto: DespacharPedidoDto, idUsuario: number): Promise<Buffer> {
    const pedido = await this.findOne(id);
    if (pedido.estados.nombreEstado !== ESTADO_FACTURADO) {
      throw new BadRequestException('Solo se puede despachar un pedido Facturado');
    }
    if (pedido.item_pedido.length === 0) {
      throw new BadRequestException('El pedido no tiene productos cargados');
    }

    const id_deposito = await this.resolverDepositoParaDespacho(idUsuario, dto.id_deposito);
    const [idEstadoDespachado, idEstadoActivo, tipoMovimiento] = await Promise.all([
      this.estadosLookup.getId(ESTADO_DESPACHADO),
      this.estadosLookup.getId(ESTADO_ACTIVO),
      this.prisma.tipo_movimiento.findFirst({ where: { nombre_movimiento: TIPO_MOVIMIENTO_DESPACHO } }),
    ]);
    if (!tipoMovimiento) {
      throw new BadRequestException(`No existe el tipo de movimiento "${TIPO_MOVIMIENTO_DESPACHO}" en el catálogo`);
    }

    const fechaDespacho = new Date();
    await this.prisma.$transaction([
      ...pedido.item_pedido.map((item) =>
        this.prisma.productos.update({
          where: { id_producto: item.id_producto },
          data: { stock_actual: { decrement: item.cantidad_bolsones } },
        }),
      ),
      ...pedido.item_pedido.map((item) =>
        this.prisma.movimiento_producto.create({
          data: {
            id_producto: item.id_producto,
            id_tipo_movimiento: tipoMovimiento.id_tipo_movimiento,
            cantidad: item.cantidad_bolsones,
            fecha_movimiento: fechaDespacho,
            id_deposito_origen: id_deposito,
            id_estado: idEstadoActivo,
            motivo: `Despacho del pedido #${id}`,
          },
        }),
      ),
      this.prisma.pedidos.update({
        where: { id_pedido: id },
        data: {
          id_estado: idEstadoDespachado,
          id_deposito,
          cantidad_copias: dto.cantidad_copias,
          fecha_despacho: fechaDespacho,
        },
      }),
    ]);

    const pedidoDespachado = await this.findOne(id);
    const pdf = await this.remitoPdfService.generar(pedidoDespachado, dto.cantidad_copias);

    const nombreArchivo = `${randomUUID()}.pdf`;
    await writeFile(join(UPLOADS_DIR, nombreArchivo), pdf);
    const archivo = await this.prisma.archivo_adjunto.create({
      data: {
        nombre_archivo: `remito-pedido-${id}.pdf`,
        ruta_archivo: nombreArchivo,
        tipo_archivo: 'application/pdf',
        fecha_carga: fechaDespacho,
      },
    });
    await this.prisma.pedidos.update({
      where: { id_pedido: id },
      data: { id_archivo_remito: archivo.id_archivo_adjunto },
    });

    return pdf;
  }

  // Reimprime el remito ya generado (no vuelve a descontar stock).
  async obtenerRemito(id: number): Promise<{ buffer: Buffer; nombreArchivo: string }> {
    const pedido = await this.prisma.pedidos.findUnique({
      where: { id_pedido: id },
      include: { archivo_remito: true },
    });
    if (!pedido) {
      throw new NotFoundException(`Pedido ${id} no encontrado`);
    }
    if (!pedido.archivo_remito) {
      throw new NotFoundException(`El pedido ${id} todavía no tiene un remito generado`);
    }
    const buffer = await readFile(join(UPLOADS_DIR, pedido.archivo_remito.ruta_archivo));
    return { buffer, nombreArchivo: pedido.archivo_remito.nombre_archivo };
  }
}
