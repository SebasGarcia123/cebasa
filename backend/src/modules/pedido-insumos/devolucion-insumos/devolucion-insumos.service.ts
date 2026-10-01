import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { EstadosLookupService } from '../../../prisma/estados-lookup.service.js';
import { PlantaLookupService, type Planta } from '../../../prisma/planta-lookup.service.js';
import { RolDeposito } from '../../../generated/prisma/client.js';
import type { JwtPayload } from '../../../auth/types/jwt-payload.interface.js';
import { CreateDevolucionInsumosDto } from './dto/create-devolucion-insumos.dto.js';
import { UpdateDevolucionInsumosDto } from './dto/update-devolucion-insumos.dto.js';
import { RechazarDevolucionInsumosDto } from './dto/rechazar-devolucion-insumos.dto.js';
import { AprobarDevolucionInsumosDto } from './dto/aprobar-devolucion-insumos.dto.js';

// Camino inverso de pedido_insumos: Pendiente = recién creada por
// Producción, a la espera de que Logística decida. Aprobado = Logística
// aceptó, ya se movió el stock (terminal). Rechazado = Logística la
// devolvió con un motivo — vuelve a quedar accionable para Producción
// (editar y volver a mandar), igual que Pendiente.
const ESTADO_PENDIENTE = 'Pendiente';
const ESTADO_APROBADO = 'Aprobado';
const ESTADO_RECHAZADO = 'Rechazado';
const ESTADOS_ACCIONABLES = new Set([ESTADO_PENDIENTE, ESTADO_RECHAZADO]);
const ESTADOS_TERMINALES = new Set([ESTADO_APROBADO]);
const TIPO_MOVIMIENTO_DEVOLUCION = 'Devolución de insumos a Logística';
const ESTADO_ACTIVO = 'Activo';

const INCLUDE_DEVOLUCION = {
  usuarios: { include: { sectores: true } },
  estados: true,
  item_devolucion_insumo: { include: { insumo: { include: { unidad_medida: true } }, lineas: true } },
} as const;

const OFFSET_ARGENTINA_MS = 3 * 60 * 60 * 1000;
function hoyArgentina(): Date {
  const hoy = new Date(Date.now() - OFFSET_ARGENTINA_MS);
  hoy.setUTCHours(0, 0, 0, 0);
  return hoy;
}

@Injectable()
export class DevolucionInsumosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly estadosLookup: EstadosLookupService,
    private readonly plantaLookup: PlantaLookupService,
  ) {}

  async create(dto: CreateDevolucionInsumosDto, idUsuario: number) {
    const idEstadoPendiente = await this.estadosLookup.getId(ESTADO_PENDIENTE);
    return this.prisma.devolucion_insumos.create({
      data: {
        id_usuario: idUsuario,
        fecha_carga: hoyArgentina(),
        id_estado: idEstadoPendiente,
        item_devolucion_insumo: {
          create: dto.items.map((item) => ({
            id_insumo: item.id_insumo,
            id_lineas: item.id_lineas,
            cantidad: item.cantidad,
          })),
        },
      },
      include: INCLUDE_DEVOLUCION,
    });
  }

  // Un administrador ve todo. Cualquier otro usuario solo ve las
  // devoluciones de su propia planta (según el sector de quien las
  // creó) — mismo criterio que pedido_insumos.
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

  // Pantalla de Producción: todas las devoluciones de su planta, con
  // filtro de fecha y "ver todos" (si no, se ocultan las Aprobadas).
  async findParaProduccion(user: JwtPayload, filtros: { desde?: string; hasta?: string; verTodos?: boolean }) {
    const planta = await this.plantaDelUsuario(user);
    const devoluciones = await this.prisma.devolucion_insumos.findMany({
      include: INCLUDE_DEVOLUCION,
      orderBy: { fecha_carga: 'desc' },
    });
    return devoluciones.filter((devolucion) => {
      if (planta) {
        const plantaDevolucion = this.plantaLookup.plantaDeSector(devolucion.usuarios.sectores);
        if (plantaDevolucion !== planta) return false;
      }
      if (!filtros.verTodos && ESTADOS_TERMINALES.has(devolucion.estados.nombreEstado)) return false;
      if (filtros.desde && devolucion.fecha_carga < new Date(filtros.desde)) return false;
      if (filtros.hasta && devolucion.fecha_carga > new Date(filtros.hasta)) return false;
      return true;
    });
  }

  // Pantalla del jefe de Logística: mismos filtros y misma vista que
  // Producción (ver todos incluye las Aprobadas), pero de su propia
  // planta — desde ahí aprueba o rechaza las Pendientes/Rechazadas.
  async findParaLogistica(user: JwtPayload, filtros: { desde?: string; hasta?: string; verTodos?: boolean }) {
    return this.findParaProduccion(user, filtros);
  }

  async findOne(id: number) {
    const devolucion = await this.prisma.devolucion_insumos.findUnique({
      where: { id_devolucion_insumos: id },
      include: INCLUDE_DEVOLUCION,
    });
    if (!devolucion) {
      throw new NotFoundException(`Devolución de insumos ${id} no encontrada`);
    }
    return devolucion;
  }

  private assertEditable(devolucion: { estados: { nombreEstado: string } }): void {
    if (!ESTADOS_ACCIONABLES.has(devolucion.estados.nombreEstado)) {
      throw new BadRequestException('La devolución ya no se puede editar en su estado actual');
    }
  }

  // Corrige una devolución Rechazada (o todavía Pendiente): reemplaza
  // la lista de ítems entera, no la parchea de a uno.
  async update(id: number, dto: UpdateDevolucionInsumosDto) {
    const devolucion = await this.findOne(id);
    this.assertEditable(devolucion);
    await this.prisma.$transaction([
      this.prisma.item_devolucion_insumo.deleteMany({ where: { id_devolucion_insumos: id } }),
      this.prisma.item_devolucion_insumo.createMany({
        data: dto.items.map((item) => ({
          id_devolucion_insumos: id,
          id_insumo: item.id_insumo,
          id_lineas: item.id_lineas,
          cantidad: item.cantidad,
        })),
      }),
    ]);
    return this.findOne(id);
  }

  // El jefe de Logística solo puede aprobar/rechazar devoluciones de su
  // propia planta.
  private async assertMismaPlantaQueCreador(
    user: JwtPayload,
    devolucion: { usuarios: { sectores: { planta: Planta | null } } },
  ): Promise<void> {
    if (user.es_administrador) {
      return;
    }
    const plantaUsuario = await this.plantaDelUsuario(user);
    const plantaDevolucion = this.plantaLookup.plantaDeSector(devolucion.usuarios.sectores);
    if (!plantaUsuario || !plantaDevolucion || plantaUsuario !== plantaDevolucion) {
      throw new BadRequestException('No podés operar devoluciones de insumos de otra planta');
    }
  }

  async rechazar(id: number, dto: RechazarDevolucionInsumosDto, user: JwtPayload) {
    const devolucion = await this.findOne(id);
    if (devolucion.estados.nombreEstado !== ESTADO_PENDIENTE) {
      throw new BadRequestException('Solo se puede rechazar una devolución Pendiente');
    }
    await this.assertMismaPlantaQueCreador(user, devolucion);
    const idEstadoRechazado = await this.estadosLookup.getId(ESTADO_RECHAZADO);
    return this.prisma.devolucion_insumos.update({
      where: { id_devolucion_insumos: id },
      data: { id_estado: idEstadoRechazado, motivo_rechazo: dto.motivo_rechazo },
    });
  }

  // Mensaje fijo para que el frontend lo reconozca y le ofrezca al jefe
  // de Logística elegir la planta a mano — mismo patrón que
  // PedidoInsumosService.PLANTA_NO_RESUELTA.
  static readonly PLANTA_NO_RESUELTA =
    'No se pudo determinar la planta de quien solicitó la devolución. Elegila manualmente.';

  // El origen/destino del traslado depende de la planta de quien creó
  // la devolución (Producción), no de quien la aprueba. Va de
  // Producción a Logística de esa misma planta — sentido inverso al de
  // pedido_insumos.recibir.
  async aprobar(id: number, dto: AprobarDevolucionInsumosDto, user: JwtPayload) {
    const devolucion = await this.findOne(id);
    if (!ESTADOS_ACCIONABLES.has(devolucion.estados.nombreEstado)) {
      throw new BadRequestException('Solo se puede aprobar una devolución Pendiente o Rechazada');
    }
    await this.assertMismaPlantaQueCreador(user, devolucion);

    const planta = this.plantaLookup.plantaDeSector(devolucion.usuarios.sectores) ?? dto.planta;
    if (!planta) {
      throw new BadRequestException(DevolucionInsumosService.PLANTA_NO_RESUELTA);
    }

    const [idDepositoOrigen, idDepositoDestino, idEstadoAprobado, idEstadoActivo, tipoMovimiento] = await Promise.all([
      this.prisma.deposito.findFirst({ where: { planta, rol_deposito: RolDeposito.PRODUCCION } }),
      this.prisma.deposito.findFirst({ where: { planta, rol_deposito: RolDeposito.LOGISTICA } }),
      this.estadosLookup.getId(ESTADO_APROBADO),
      this.estadosLookup.getId(ESTADO_ACTIVO),
      this.prisma.tipo_movimiento.findFirst({ where: { nombre_movimiento: TIPO_MOVIMIENTO_DEVOLUCION } }),
    ]);
    if (!idDepositoOrigen || !idDepositoDestino) {
      throw new BadRequestException(`No se encontraron los depósitos de Producción/Logística de la planta ${planta}`);
    }
    if (!tipoMovimiento) {
      throw new BadRequestException(`No existe el tipo de movimiento "${TIPO_MOVIMIENTO_DEVOLUCION}" en el catálogo`);
    }

    const fechaMovimiento = new Date();
    // Traslado interno Producción -> Logística: no toca insumo.stock_actual
    // (el total global no cambia, solo se redistribuye entre depósitos).
    await this.prisma.$transaction([
      ...devolucion.item_devolucion_insumo.map((item) =>
        this.prisma.stock_insumo_deposito.upsert({
          where: { id_insumo_id_deposito: { id_insumo: item.id_insumo, id_deposito: idDepositoOrigen.id_deposito } },
          create: { id_insumo: item.id_insumo, id_deposito: idDepositoOrigen.id_deposito, cantidad: -Number(item.cantidad) },
          update: { cantidad: { decrement: Number(item.cantidad) } },
        }),
      ),
      ...devolucion.item_devolucion_insumo.map((item) =>
        this.prisma.stock_insumo_deposito.upsert({
          where: { id_insumo_id_deposito: { id_insumo: item.id_insumo, id_deposito: idDepositoDestino.id_deposito } },
          create: { id_insumo: item.id_insumo, id_deposito: idDepositoDestino.id_deposito, cantidad: Number(item.cantidad) },
          update: { cantidad: { increment: Number(item.cantidad) } },
        }),
      ),
      ...devolucion.item_devolucion_insumo.map((item) =>
        this.prisma.movimiento_insumo.create({
          data: {
            id_insumo: item.id_insumo,
            id_tipo_movimiento: tipoMovimiento.id_tipo_movimiento,
            cantidad: item.cantidad,
            fecha_movimiento: fechaMovimiento,
            id_deposito_origen: idDepositoOrigen.id_deposito,
            id_deposito_destino: idDepositoDestino.id_deposito,
            id_item_devolucion_insumo: item.id_item_devolucion_insumo,
            id_estado: idEstadoActivo,
            motivo: `Devolución de insumos #${id}`,
          },
        }),
      ),
      this.prisma.devolucion_insumos.update({ where: { id_devolucion_insumos: id }, data: { id_estado: idEstadoAprobado } }),
    ]);
    return this.findOne(id);
  }
}
