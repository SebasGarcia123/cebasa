import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { EstadosLookupService } from '../../../prisma/estados-lookup.service.js';
import { PlantaLookupService, type Planta } from '../../../prisma/planta-lookup.service.js';
import { RolDeposito } from '../../../generated/prisma/client.js';
import type { JwtPayload } from '../../../auth/types/jwt-payload.interface.js';
import { CreatePedidoInsumosDto } from './dto/create-pedido-insumos.dto.js';
import { UpdatePedidoInsumosDto } from './dto/update-pedido-insumos.dto.js';
import { CumplirPedidoInsumosDto } from './dto/cumplir-pedido-insumos.dto.js';
import { ParaRevisarPedidoInsumosDto } from './dto/para-revisar-pedido-insumos.dto.js';
import { RecibirPedidoInsumosDto } from './dto/recibir-pedido-insumos.dto.js';

// Pendiente: recién creado por Producción, a la espera de que
// Logística lo cumpla. Cumplido: Logística ya cargó cantidades, a la
// espera de que Producción decida. Recibido: Producción confirmó, ya
// se movió el stock (terminal). Rechazado: Producción lo mandó a
// revisar con un motivo — vuelve a quedar accionable para Logística,
// igual que Pendiente. Anulado: Producción lo canceló antes de que
// Logística actuara (terminal).
const ESTADO_PENDIENTE = 'Pendiente';
const ESTADO_CUMPLIDO = 'Cumplido';
const ESTADO_RECIBIDO = 'Recibido';
const ESTADO_RECHAZADO = 'Rechazado';
const ESTADO_ANULADO = 'Anulado';
const ESTADOS_ACCIONABLES_LOGISTICA = new Set([ESTADO_PENDIENTE, ESTADO_RECHAZADO]);
const ESTADOS_TERMINALES = new Set([ESTADO_RECIBIDO, ESTADO_ANULADO]);
const TIPO_MOVIMIENTO_RECEPCION = 'Recepción de pedido de insumos';
const ESTADO_ACTIVO = 'Activo';

const INCLUDE_PEDIDO = {
  usuarios: { include: { sectores: true } },
  estados: true,
  item_pedido_insumo: { include: { insumo: { include: { unidad_medida: true } }, lineas: true } },
} as const;

const OFFSET_ARGENTINA_MS = 3 * 60 * 60 * 1000;
function hoyArgentina(): Date {
  const hoy = new Date(Date.now() - OFFSET_ARGENTINA_MS);
  hoy.setUTCHours(0, 0, 0, 0);
  return hoy;
}

@Injectable()
export class PedidoInsumosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly estadosLookup: EstadosLookupService,
    private readonly plantaLookup: PlantaLookupService,
  ) {}

  async create(dto: CreatePedidoInsumosDto, idUsuario: number) {
    const idEstadoPendiente = await this.estadosLookup.getId(ESTADO_PENDIENTE);
    return this.prisma.pedido_insumos.create({
      data: {
        id_usuario: idUsuario,
        fecha_carga: hoyArgentina(),
        fecha_necesidad: new Date(dto.fecha_necesidad),
        id_estado: idEstadoPendiente,
        item_pedido_insumo: {
          create: dto.items.map((item) => ({
            id_insumo: item.id_insumo,
            id_lineas: item.id_lineas,
            cantidad_solicitada: item.cantidad_solicitada,
          })),
        },
      },
      include: INCLUDE_PEDIDO,
    });
  }

  // Un administrador ve todo. Cualquier otro usuario solo ve los
  // pedidos de su propia planta (según el sector de quien los creó) —
  // mismo criterio que el resto de las pantallas de planta.
  private async plantaDelUsuario(user: JwtPayload) {
    if (user.es_administrador) {
      return null;
    }
    const usuario = await this.prisma.usuarios.findUnique({
      where: { id_usuario: user.sub },
      include: { sectores: true },
    });
    return usuario ? this.plantaLookup.plantaDeSector(usuario.sectores) : null;
  }

  // Pantalla de Producción: todos los pedidos de su planta, con filtro
  // de fecha y "ver todos" (si no, se ocultan los que ya llegaron a un
  // estado terminal: Recibido o Anulado).
  async findParaProduccion(user: JwtPayload, filtros: { desde?: string; hasta?: string; verTodos?: boolean }) {
    const planta = await this.plantaDelUsuario(user);
    const pedidos = await this.prisma.pedido_insumos.findMany({
      include: INCLUDE_PEDIDO,
      orderBy: { fecha_carga: 'desc' },
    });
    return pedidos.filter((pedido) => {
      if (planta) {
        const plantaPedido = this.plantaLookup.plantaDeSector(pedido.usuarios.sectores);
        if (plantaPedido !== planta) return false;
      }
      if (!filtros.verTodos && ESTADOS_TERMINALES.has(pedido.estados.nombreEstado)) return false;
      if (filtros.desde && pedido.fecha_carga < new Date(filtros.desde)) return false;
      if (filtros.hasta && pedido.fecha_carga > new Date(filtros.hasta)) return false;
      return true;
    });
  }

  // Pantalla de Logística: solo lo que necesita su acción (Pendiente o
  // Rechazado) de su propia planta.
  async findParaLogistica(user: JwtPayload) {
    const planta = await this.plantaDelUsuario(user);
    const pedidos = await this.prisma.pedido_insumos.findMany({
      where: { estados: { nombreEstado: { in: [...ESTADOS_ACCIONABLES_LOGISTICA] } } },
      include: INCLUDE_PEDIDO,
      orderBy: { fecha_necesidad: 'asc' },
    });
    if (!planta) {
      return pedidos;
    }
    return pedidos.filter((pedido) => this.plantaLookup.plantaDeSector(pedido.usuarios.sectores) === planta);
  }

  async findOne(id: number) {
    const pedido = await this.prisma.pedido_insumos.findUnique({
      where: { id_pedido_insumos: id },
      include: INCLUDE_PEDIDO,
    });
    if (!pedido) {
      throw new NotFoundException(`Pedido de insumos ${id} no encontrado`);
    }
    return pedido;
  }

  private assertEditableSolicitud(pedido: { estados: { nombreEstado: string } }): void {
    if (!ESTADOS_ACCIONABLES_LOGISTICA.has(pedido.estados.nombreEstado)) {
      throw new BadRequestException('El pedido ya no se puede editar en su estado actual');
    }
  }

  async update(id: number, dto: UpdatePedidoInsumosDto) {
    const pedido = await this.findOne(id);
    this.assertEditableSolicitud(pedido);
    return this.prisma.pedido_insumos.update({
      where: { id_pedido_insumos: id },
      data: { fecha_necesidad: dto.fecha_necesidad ? new Date(dto.fecha_necesidad) : undefined },
    });
  }

  async anular(id: number) {
    const pedido = await this.findOne(id);
    if (pedido.estados.nombreEstado !== ESTADO_PENDIENTE) {
      throw new BadRequestException('Solo se puede anular un pedido Pendiente (todavía no lo tomó Logística)');
    }
    const idEstadoAnulado = await this.estadosLookup.getId(ESTADO_ANULADO);
    return this.prisma.pedido_insumos.update({
      where: { id_pedido_insumos: id },
      data: { id_estado: idEstadoAnulado },
    });
  }

  // Logística solo puede cumplir pedidos de su propia planta.
  private async assertMismaPlantaQueCreador(user: JwtPayload, pedido: { usuarios: { sectores: { planta: Planta | null } } }): Promise<void> {
    if (user.es_administrador) {
      return;
    }
    const plantaUsuario = await this.plantaDelUsuario(user);
    const plantaPedido = this.plantaLookup.plantaDeSector(pedido.usuarios.sectores);
    if (!plantaUsuario || !plantaPedido || plantaUsuario !== plantaPedido) {
      throw new BadRequestException('No podés operar pedidos de insumos de otra planta');
    }
  }

  async cumplir(id: number, dto: CumplirPedidoInsumosDto, user: JwtPayload) {
    const pedido = await this.findOne(id);
    if (!ESTADOS_ACCIONABLES_LOGISTICA.has(pedido.estados.nombreEstado)) {
      throw new BadRequestException('Solo se puede cumplir un pedido Pendiente o Rechazado');
    }
    await this.assertMismaPlantaQueCreador(user, pedido);

    const idsValidos = new Set(pedido.item_pedido_insumo.map((i) => i.id_item_pedido_insumo));
    for (const item of dto.items) {
      if (!idsValidos.has(item.id_item_pedido_insumo)) {
        throw new BadRequestException(`El ítem ${item.id_item_pedido_insumo} no pertenece a este pedido`);
      }
    }

    const idEstadoCumplido = await this.estadosLookup.getId(ESTADO_CUMPLIDO);
    await this.prisma.$transaction([
      ...dto.items.map((item) =>
        this.prisma.item_pedido_insumo.update({
          where: { id_item_pedido_insumo: item.id_item_pedido_insumo },
          data: { cantidad_abastecida: item.cantidad_abastecida, observaciones: item.observaciones ?? null },
        }),
      ),
      this.prisma.pedido_insumos.update({ where: { id_pedido_insumos: id }, data: { id_estado: idEstadoCumplido } }),
    ]);
    return this.findOne(id);
  }

  async paraRevisar(id: number, dto: ParaRevisarPedidoInsumosDto) {
    const pedido = await this.findOne(id);
    if (pedido.estados.nombreEstado !== ESTADO_CUMPLIDO) {
      throw new BadRequestException('Solo se puede mandar a revisar un pedido Cumplido');
    }
    const idEstadoRechazado = await this.estadosLookup.getId(ESTADO_RECHAZADO);
    return this.prisma.pedido_insumos.update({
      where: { id_pedido_insumos: id },
      data: { id_estado: idEstadoRechazado, motivo_rechazo: dto.motivo_rechazo },
    });
  }

  // Mensaje fijo para que el frontend lo reconozca y, en vez de mostrar
  // el error sin más, le ofrezca a quien recibe elegir la planta a mano
  // (ver PedidoInsumosList en el frontend) — mismo patrón que
  // PedidosService.DEPOSITO_NO_RESUELTO para el despacho de pedidos.
  static readonly PLANTA_NO_RESUELTA =
    'No se pudo determinar la planta de quien solicitó el pedido. Elegila manualmente.';

  // El destino/origen del traslado depende de la planta de quien
  // solicitó el pedido (no de quien lo recibe): "según la pertenencia
  // del usuario (Caseros o Baradero)". Si el sector de quien solicitó
  // no tiene planta (ej. un administrador sin sector real), se usa la
  // planta elegida a mano como respaldo.
  async recibir(id: number, dto: RecibirPedidoInsumosDto = {}) {
    const pedido = await this.findOne(id);
    if (pedido.estados.nombreEstado !== ESTADO_CUMPLIDO) {
      throw new BadRequestException('Solo se puede recibir un pedido Cumplido');
    }
    const planta = this.plantaLookup.plantaDeSector(pedido.usuarios.sectores) ?? dto.planta;
    if (!planta) {
      throw new BadRequestException(PedidoInsumosService.PLANTA_NO_RESUELTA);
    }

    const [idDepositoOrigen, idDepositoDestino, idEstadoRecibido, idEstadoActivo, tipoMovimiento] = await Promise.all([
      this.prisma.deposito.findFirst({ where: { planta, rol_deposito: RolDeposito.LOGISTICA } }),
      this.prisma.deposito.findFirst({ where: { planta, rol_deposito: RolDeposito.PRODUCCION } }),
      this.estadosLookup.getId(ESTADO_RECIBIDO),
      this.estadosLookup.getId(ESTADO_ACTIVO),
      this.prisma.tipo_movimiento.findFirst({ where: { nombre_movimiento: TIPO_MOVIMIENTO_RECEPCION } }),
    ]);
    if (!idDepositoOrigen || !idDepositoDestino) {
      throw new BadRequestException(`No se encontraron los depósitos de Logística/Producción de la planta ${planta}`);
    }
    if (!tipoMovimiento) {
      throw new BadRequestException(`No existe el tipo de movimiento "${TIPO_MOVIMIENTO_RECEPCION}" en el catálogo`);
    }

    const fechaMovimiento = new Date();
    // Traslado interno Logística -> Producción: no toca insumo.stock_actual
    // (el total global no cambia, solo se redistribuye entre depósitos).
    await this.prisma.$transaction([
      ...pedido.item_pedido_insumo.map((item) =>
        this.prisma.stock_insumo_deposito.upsert({
          where: { id_insumo_id_deposito: { id_insumo: item.id_insumo, id_deposito: idDepositoOrigen.id_deposito } },
          create: { id_insumo: item.id_insumo, id_deposito: idDepositoOrigen.id_deposito, cantidad: -Number(item.cantidad_abastecida) },
          update: { cantidad: { decrement: Number(item.cantidad_abastecida) } },
        }),
      ),
      ...pedido.item_pedido_insumo.map((item) =>
        this.prisma.stock_insumo_deposito.upsert({
          where: { id_insumo_id_deposito: { id_insumo: item.id_insumo, id_deposito: idDepositoDestino.id_deposito } },
          create: { id_insumo: item.id_insumo, id_deposito: idDepositoDestino.id_deposito, cantidad: Number(item.cantidad_abastecida) },
          update: { cantidad: { increment: Number(item.cantidad_abastecida) } },
        }),
      ),
      ...pedido.item_pedido_insumo.map((item) =>
        this.prisma.movimiento_insumo.create({
          data: {
            id_insumo: item.id_insumo,
            id_tipo_movimiento: tipoMovimiento.id_tipo_movimiento,
            cantidad: item.cantidad_abastecida,
            fecha_movimiento: fechaMovimiento,
            id_deposito_origen: idDepositoOrigen.id_deposito,
            id_deposito_destino: idDepositoDestino.id_deposito,
            id_item_pedido_insumo: item.id_item_pedido_insumo,
            id_estado: idEstadoActivo,
            motivo: `Recepción del pedido de insumos #${id}`,
          },
        }),
      ),
      this.prisma.pedido_insumos.update({ where: { id_pedido_insumos: id }, data: { id_estado: idEstadoRecibido } }),
    ]);
    return this.findOne(id);
  }
}
