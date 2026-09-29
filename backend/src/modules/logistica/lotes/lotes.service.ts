import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { EstadosLookupService } from '../../../prisma/estados-lookup.service.js';
import { PlantaLookupService, type Planta } from '../../../prisma/planta-lookup.service.js';
import type { JwtPayload } from '../../../auth/types/jwt-payload.interface.js';
import { CreateLoteDto } from './dto/create-lote.dto.js';
import { UpdateLoteDto } from './dto/update-lote.dto.js';
import { RechazarLoteDto } from './dto/rechazar-lote.dto.js';

const TIPO_LOTE_INTERPLANTA = 'Interplanta';
const ESTADO_PENDIENTE = 'Pendiente';
const ESTADO_PENDIENTE_APROBACION = 'Pendiente de aprobación';
const ESTADO_APROBADO = 'Aprobado';
const ESTADO_RECHAZADO = 'Rechazado';
const ESTADO_ACTIVO = 'Activo';
const TIPO_MOVIMIENTO_TRASLADO = 'Traslado interplanta';

const INCLUDE_LOTE = {
  chofer: true,
  camion: true,
  tipo_lote: true,
  estados: true,
  deposito_origen: true,
  deposito_destino: true,
  item_lote: { include: { productos: true, insumo: true } },
} as const;

@Injectable()
export class LotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly estadosLookup: EstadosLookupService,
    private readonly plantaLookup: PlantaLookupService,
  ) {}

  private async esTipoInterplanta(idTipoLote: number): Promise<boolean> {
    const tipo = await this.prisma.tipo_lote.findUnique({ where: { id_tipo_lote: idTipoLote } });
    return tipo?.descripcion_lote === TIPO_LOTE_INTERPLANTA;
  }

  // Para un lote Interplanta, origen y destino son obligatorios,
  // distintos entre sí, y cada uno tiene que tener planta asignada
  // (deposito.planta) — si no, no hay forma de saber después quién
  // tiene que aprobarlo.
  private async assertDepositosInterplanta(dto: { id_deposito_origen?: number; id_deposito_destino?: number }): Promise<void> {
    if (!dto.id_deposito_origen || !dto.id_deposito_destino) {
      throw new BadRequestException('Un lote Interplanta necesita depósito de origen y de destino');
    }
    if (dto.id_deposito_origen === dto.id_deposito_destino) {
      throw new BadRequestException('El depósito de origen y de destino no pueden ser el mismo');
    }
    const [origen, destino] = await Promise.all([
      this.prisma.deposito.findUnique({ where: { id_deposito: dto.id_deposito_origen } }),
      this.prisma.deposito.findUnique({ where: { id_deposito: dto.id_deposito_destino } }),
    ]);
    const plantaOrigen = origen ? this.plantaLookup.plantaDeDeposito(origen) : null;
    const plantaDestino = destino ? this.plantaLookup.plantaDeDeposito(destino) : null;
    if (!plantaOrigen || !plantaDestino) {
      throw new BadRequestException('No se pudo determinar la planta de alguno de los depósitos elegidos');
    }
  }

  async create(dto: CreateLoteDto) {
    if (await this.esTipoInterplanta(dto.id_tipo_lote)) {
      await this.assertDepositosInterplanta(dto);
    }
    const idEstadoPendiente = await this.estadosLookup.getId(ESTADO_PENDIENTE);
    return this.prisma.lotes.create({
      data: { ...dto, id_estado: idEstadoPendiente, fecha_lote: new Date(dto.fecha_lote) },
    });
  }

  findAll() {
    return this.prisma.lotes.findMany({ include: INCLUDE_LOTE });
  }

  async findOne(id: number) {
    const lote = await this.prisma.lotes.findUnique({ where: { id_lote: id }, include: INCLUDE_LOTE });
    if (!lote) {
      throw new NotFoundException(`Lote ${id} no encontrado`);
    }
    return lote;
  }

  // Editable mientras está Pendiente (recién cargado) o Rechazado (se
  // corrige y hay que volver a despacharlo a mano). Si estaba
  // Rechazado, al guardar vuelve a Pendiente y se limpia el motivo.
  async update(id: number, dto: UpdateLoteDto) {
    const lote = await this.findOne(id);
    if (lote.estados.nombreEstado !== ESTADO_PENDIENTE && lote.estados.nombreEstado !== ESTADO_RECHAZADO) {
      throw new BadRequestException('Un lote solo se puede editar mientras está Pendiente o Rechazado');
    }

    const idTipoLote = dto.id_tipo_lote ?? lote.id_tipo_lote;
    if (await this.esTipoInterplanta(idTipoLote)) {
      await this.assertDepositosInterplanta({
        id_deposito_origen: dto.id_deposito_origen ?? lote.id_deposito_origen ?? undefined,
        id_deposito_destino: dto.id_deposito_destino ?? lote.id_deposito_destino ?? undefined,
      });
    }

    const data: { id_estado?: number; motivo_rechazo?: null } = {};
    if (lote.estados.nombreEstado === ESTADO_RECHAZADO) {
      data.id_estado = await this.estadosLookup.getId(ESTADO_PENDIENTE);
      data.motivo_rechazo = null;
    }

    return this.prisma.lotes.update({
      where: { id_lote: id },
      data: { ...dto, ...data, fecha_lote: dto.fecha_lote ? new Date(dto.fecha_lote) : undefined },
    });
  }

  async remove(id: number) {
    const lote = await this.findOne(id);
    if (lote.estados.nombreEstado !== ESTADO_PENDIENTE) {
      throw new BadRequestException('Un lote solo se puede eliminar mientras está Pendiente');
    }
    return this.prisma.lotes.delete({ where: { id_lote: id } });
  }

  // Quien emite despacha: el lote deja de ser editable y pasa a manos
  // del Jefe de Logística de la planta destino para revisión.
  async despachar(id: number) {
    const lote = await this.findOne(id);
    if (lote.estados.nombreEstado !== ESTADO_PENDIENTE) {
      throw new BadRequestException('Solo se puede despachar un lote Pendiente');
    }
    if (lote.item_lote.length === 0) {
      throw new BadRequestException('El lote no tiene ítems cargados');
    }

    const idEstadoPendienteAprobacion = await this.estadosLookup.getId(ESTADO_PENDIENTE_APROBACION);
    return this.prisma.lotes.update({
      where: { id_lote: id },
      data: { id_estado: idEstadoPendienteAprobacion, fecha_despacho: new Date() },
    });
  }

  // El Jefe de Logística de la planta DESTINO aprueba: cada ítem se
  // descuenta del depósito origen y se suma al destino (stock real por
  // depósito), con su movimiento de traslado. El stock global de
  // productos/insumos no cambia — es la misma mercadería, solo se
  // redistribuye entre plantas.
  async aprobar(id: number, user: JwtPayload) {
    const lote = await this.findOne(id);
    if (lote.estados.nombreEstado !== ESTADO_PENDIENTE_APROBACION) {
      throw new BadRequestException('Solo se puede aprobar un lote pendiente de aprobación');
    }
    if (!lote.deposito_destino) {
      throw new BadRequestException('El lote no tiene depósito de destino');
    }
    await this.assertPlanta(user, lote.deposito_destino);

    const idDepositoOrigen = lote.id_deposito_origen!;
    const idDepositoDestino = lote.id_deposito_destino!;
    const items = lote.item_lote.map((item) => ({
      id_producto: item.id_producto,
      id_insumo: item.id_insumo,
      cantidad: Math.round(Number(item.cantidad) * 10000) / 10000,
      cantidadEntera: Math.round(Number(item.cantidad)),
    }));

    await this.assertStockSuficiente(items, idDepositoOrigen);

    const [idEstadoAprobado, idEstadoActivo, tipoMovimiento] = await Promise.all([
      this.estadosLookup.getId(ESTADO_APROBADO),
      this.estadosLookup.getId(ESTADO_ACTIVO),
      this.prisma.tipo_movimiento.findFirst({ where: { nombre_movimiento: TIPO_MOVIMIENTO_TRASLADO } }),
    ]);
    if (!tipoMovimiento) {
      throw new BadRequestException(`No existe el tipo de movimiento "${TIPO_MOVIMIENTO_TRASLADO}" en el catálogo`);
    }

    const fechaMovimiento = new Date();
    const productos = items.filter((item) => item.id_producto != null);
    const insumos = items.filter((item) => item.id_insumo != null);

    await this.prisma.$transaction([
      ...productos.flatMap((item) => [
        this.prisma.stock_producto_deposito.upsert({
          where: { id_producto_id_deposito: { id_producto: item.id_producto!, id_deposito: idDepositoOrigen } },
          create: { id_producto: item.id_producto!, id_deposito: idDepositoOrigen, cantidad: -item.cantidadEntera },
          update: { cantidad: { decrement: item.cantidadEntera } },
        }),
        this.prisma.stock_producto_deposito.upsert({
          where: { id_producto_id_deposito: { id_producto: item.id_producto!, id_deposito: idDepositoDestino } },
          create: { id_producto: item.id_producto!, id_deposito: idDepositoDestino, cantidad: item.cantidadEntera },
          update: { cantidad: { increment: item.cantidadEntera } },
        }),
        this.prisma.movimiento_producto.create({
          data: {
            id_producto: item.id_producto!,
            id_tipo_movimiento: tipoMovimiento.id_tipo_movimiento,
            cantidad: item.cantidadEntera,
            fecha_movimiento: fechaMovimiento,
            id_deposito_origen: idDepositoOrigen,
            id_deposito_destino: idDepositoDestino,
            id_estado: idEstadoActivo,
            motivo: `Traslado por aprobación del lote interplanta #${id}`,
          },
        }),
      ]),
      ...insumos.flatMap((item) => [
        this.prisma.stock_insumo_deposito.upsert({
          where: { id_insumo_id_deposito: { id_insumo: item.id_insumo!, id_deposito: idDepositoOrigen } },
          create: { id_insumo: item.id_insumo!, id_deposito: idDepositoOrigen, cantidad: -item.cantidadEntera },
          update: { cantidad: { decrement: item.cantidadEntera } },
        }),
        this.prisma.stock_insumo_deposito.upsert({
          where: { id_insumo_id_deposito: { id_insumo: item.id_insumo!, id_deposito: idDepositoDestino } },
          create: { id_insumo: item.id_insumo!, id_deposito: idDepositoDestino, cantidad: item.cantidadEntera },
          update: { cantidad: { increment: item.cantidadEntera } },
        }),
        this.prisma.movimiento_insumo.create({
          data: {
            id_insumo: item.id_insumo!,
            id_tipo_movimiento: tipoMovimiento.id_tipo_movimiento,
            cantidad: item.cantidad,
            fecha_movimiento: fechaMovimiento,
            id_deposito_origen: idDepositoOrigen,
            id_deposito_destino: idDepositoDestino,
            id_estado: idEstadoActivo,
            motivo: `Traslado por aprobación del lote interplanta #${id}`,
          },
        }),
      ]),
      this.prisma.lotes.update({ where: { id_lote: id }, data: { id_estado: idEstadoAprobado } }),
    ]);

    return this.findOne(id);
  }

  // No se puede trasladar más de lo que hay físicamente en el depósito
  // origen: a diferencia de lote_prod (que solo descuenta consumo de
  // producción y puede quedar en negativo), acá dejar un saldo negativo
  // significaría que la planta origen "prestó" algo que no tenía.
  private async assertStockSuficiente(
    items: { id_producto: number | null; id_insumo: number | null; cantidadEntera: number }[],
    idDeposito: number,
  ): Promise<void> {
    for (const item of items) {
      if (item.id_producto != null) {
        const stock = await this.prisma.stock_producto_deposito.findUnique({
          where: { id_producto_id_deposito: { id_producto: item.id_producto, id_deposito: idDeposito } },
        });
        if ((stock?.cantidad ?? 0) < item.cantidadEntera) {
          const producto = await this.prisma.productos.findUnique({ where: { id_producto: item.id_producto } });
          throw new BadRequestException(
            `No hay stock suficiente de "${producto?.descripcion_producto ?? item.id_producto}" en el depósito de origen`,
          );
        }
      }
      if (item.id_insumo != null) {
        const stock = await this.prisma.stock_insumo_deposito.findUnique({
          where: { id_insumo_id_deposito: { id_insumo: item.id_insumo, id_deposito: idDeposito } },
        });
        if ((stock?.cantidad ?? 0) < item.cantidadEntera) {
          const insumo = await this.prisma.insumo.findUnique({ where: { id_insumo: item.id_insumo } });
          throw new BadRequestException(
            `No hay stock suficiente de "${insumo?.nombre_insumo ?? item.id_insumo}" en el depósito de origen`,
          );
        }
      }
    }
  }

  async rechazar(id: number, dto: RechazarLoteDto, user: JwtPayload) {
    const lote = await this.findOne(id);
    if (lote.estados.nombreEstado !== ESTADO_PENDIENTE_APROBACION) {
      throw new BadRequestException('Solo se puede rechazar un lote pendiente de aprobación');
    }
    if (!lote.deposito_destino) {
      throw new BadRequestException('El lote no tiene depósito de destino');
    }
    await this.assertPlanta(user, lote.deposito_destino);

    const idEstadoRechazado = await this.estadosLookup.getId(ESTADO_RECHAZADO);
    return this.prisma.lotes.update({
      where: { id_lote: id },
      data: { id_estado: idEstadoRechazado, motivo_rechazo: dto.motivo_rechazo },
    });
  }

  // Un Jefe de Logística solo puede aprobar/rechazar lotes cuya planta
  // destino coincide con la suya (según su sector), no los de la otra.
  // Los administradores no tienen planta asignada, quedan exceptuados.
  private async assertPlanta(user: JwtPayload, deposito: { planta: Planta | null }): Promise<void> {
    if (user.es_administrador) {
      return;
    }
    const usuario = await this.prisma.usuarios.findUnique({
      where: { id_usuario: user.sub },
      include: { sectores: true },
    });
    const plantaUsuario = usuario ? this.plantaLookup.plantaDeSector(usuario.sectores) : null;
    const plantaDeposito = this.plantaLookup.plantaDeDeposito(deposito);
    if (!plantaUsuario || !plantaDeposito || plantaUsuario !== plantaDeposito) {
      throw new BadRequestException('No podés aprobar ni rechazar lotes interplanta destinados a otra planta');
    }
  }
}
