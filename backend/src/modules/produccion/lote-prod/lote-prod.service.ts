import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { EstadosLookupService } from '../../../prisma/estados-lookup.service.js';
import { CreateLoteProdDto } from './dto/create-lote-prod.dto.js';
import { UpdateLoteProdDto } from './dto/update-lote-prod.dto.js';
import { RechazarLoteProdDto } from './dto/rechazar-lote-prod.dto.js';

const ESTADO_PENDIENTE = 'Pendiente de aprobación';
const ESTADO_APROBADO = 'Aprobado';
const ESTADO_RECHAZADO = 'Rechazado';
const ESTADO_ACTIVO = 'Activo';
const ESTADO_RECETA_ACTIVA = 'Activo';
const TIPO_MOVIMIENTO_INGRESO_PRODUCCION = 'Ingreso por producción';
const TIPO_MOVIMIENTO_CONSUMO_PRODUCCION = 'Consumo produccion';

@Injectable()
export class LoteProdService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly estadosLookup: EstadosLookupService,
  ) {}

  async create(dto: CreateLoteProdDto) {
    const idEstadoPendiente = await this.estadosLookup.getId(ESTADO_PENDIENTE);
    return this.prisma.lote_prod.create({
      data: { ...dto, id_estado: idEstadoPendiente, fecha_lote_prod: new Date(dto.fecha_lote_prod) },
    });
  }

  findAll() {
    return this.prisma.lote_prod.findMany({
      include: { turnos: true, estados: true, deposito: true },
    });
  }

  async findOne(id: number) {
    const lote = await this.prisma.lote_prod.findUnique({
      where: { id_lote: id },
      include: {
        turnos: true,
        estados: true,
        deposito: true,
        item_prod: { include: { productos: true, lineas: true } },
      },
    });
    if (!lote) {
      throw new NotFoundException(`Lote de producción ${id} no encontrado`);
    }
    return lote;
  }

  // El estado ya no se edita a mano (ver UpdateLoteProdDto): lo maneja
  // este método según en qué estado esté el lote al momento de guardar.
  async update(id: number, dto: UpdateLoteProdDto) {
    const lote = await this.findOne(id);

    if (lote.estados.nombreEstado === ESTADO_APROBADO) {
      throw new BadRequestException('No se puede editar un lote de producción ya aprobado');
    }

    // Si Producción reedita un lote que Logística rechazó, vuelve a
    // quedar pendiente de aprobación y se limpia el motivo del rechazo
    // anterior. Si ya estaba pendiente, sigue pendiente sin cambios.
    const data: { id_estado?: number; motivo_rechazo?: null } = {};
    if (lote.estados.nombreEstado === ESTADO_RECHAZADO) {
      data.id_estado = await this.estadosLookup.getId(ESTADO_PENDIENTE);
      data.motivo_rechazo = null;
    }

    return this.prisma.lote_prod.update({
      where: { id_lote: id },
      data: {
        ...dto,
        ...data,
        fecha_lote_prod: dto.fecha_lote_prod ? new Date(dto.fecha_lote_prod) : undefined,
      },
    });
  }

  // Logística aprueba: el lote pasa a "Aprobado", cada ítem suma su
  // cantidad al stock del producto (con su movimiento de ingreso), y
  // además se descuentan del depósito del lote los insumos que marque
  // la receta activa de cada producto, cantidad_utilizada × cantidad
  // producida (con su propio movimiento de consumo).
  async aprobar(id: number) {
    const lote = await this.findOne(id);

    if (lote.estados.nombreEstado !== ESTADO_PENDIENTE) {
      throw new BadRequestException('Solo se puede aprobar un lote pendiente de aprobación');
    }

    const [idEstadoAprobado, idEstadoActivo, tipoMovimientoIngreso, tipoMovimientoConsumo, consumoInsumos] =
      await Promise.all([
        this.estadosLookup.getId(ESTADO_APROBADO),
        this.estadosLookup.getId(ESTADO_ACTIVO),
        this.prisma.tipo_movimiento.findFirst({
          where: { nombre_movimiento: TIPO_MOVIMIENTO_INGRESO_PRODUCCION },
        }),
        this.prisma.tipo_movimiento.findFirst({
          where: { nombre_movimiento: TIPO_MOVIMIENTO_CONSUMO_PRODUCCION },
        }),
        this.calcularConsumoInsumos(lote.item_prod),
      ]);
    if (!tipoMovimientoIngreso) {
      throw new BadRequestException(
        `No existe el tipo de movimiento "${TIPO_MOVIMIENTO_INGRESO_PRODUCCION}" en el catálogo`,
      );
    }
    if (consumoInsumos.length > 0 && !tipoMovimientoConsumo) {
      throw new BadRequestException(
        `No existe el tipo de movimiento "${TIPO_MOVIMIENTO_CONSUMO_PRODUCCION}" en el catálogo`,
      );
    }

    const fechaMovimiento = new Date();
    await this.prisma.$transaction([
      ...lote.item_prod.map((item) =>
        this.prisma.productos.update({
          where: { id_producto: item.id_producto },
          data: { stock_actual: { increment: item.cantidad } },
        }),
      ),
      ...lote.item_prod.map((item) =>
        this.prisma.movimiento_producto.create({
          data: {
            id_producto: item.id_producto,
            id_tipo_movimiento: tipoMovimientoIngreso.id_tipo_movimiento,
            cantidad: item.cantidad,
            fecha_movimiento: fechaMovimiento,
            id_estado: idEstadoActivo,
            motivo: `Ingreso por aprobación del lote de producción #${id}`,
          },
        }),
      ),
      ...consumoInsumos.map((consumo) =>
        this.prisma.insumo.update({
          where: { id_insumo: consumo.id_insumo },
          data: { stock_actual: { decrement: consumo.cantidadEntera } },
        }),
      ),
      ...consumoInsumos.map((consumo) =>
        this.prisma.stock_insumo_deposito.upsert({
          where: {
            id_insumo_id_deposito: { id_insumo: consumo.id_insumo, id_deposito: lote.id_deposito },
          },
          create: {
            id_insumo: consumo.id_insumo,
            id_deposito: lote.id_deposito,
            cantidad: -consumo.cantidadEntera,
          },
          update: { cantidad: { decrement: consumo.cantidadEntera } },
        }),
      ),
      ...consumoInsumos.map((consumo) =>
        this.prisma.movimiento_insumo.create({
          data: {
            id_insumo: consumo.id_insumo,
            id_tipo_movimiento: tipoMovimientoConsumo!.id_tipo_movimiento,
            cantidad: consumo.cantidad,
            fecha_movimiento: fechaMovimiento,
            id_deposito_origen: lote.id_deposito,
            id_estado: idEstadoActivo,
            motivo: `Consumo por aprobación del lote de producción #${id}`,
          },
        }),
      ),
      this.prisma.lote_prod.update({
        where: { id_lote: id },
        data: { id_estado: idEstadoAprobado },
      }),
    ]);

    return this.findOne(id);
  }

  // Suma, insumo por insumo, cuánto consume todo el lote según la
  // receta activa de cada producto (cantidad_utilizada × cantidad
  // producida en cada ítem). Los productos sin receta activa no
  // descuentan nada. Los insumos no "stockeable" (servicios,
  // intangibles) tampoco, igual que en el resto del sistema.
  private async calcularConsumoInsumos(
    items: { id_producto: number; cantidad: number }[],
  ): Promise<{ id_insumo: number; cantidad: number; cantidadEntera: number }[]> {
    const idsProducto = [...new Set(items.map((item) => item.id_producto))];
    const recetas = await this.prisma.receta.findMany({
      where: { id_producto: { in: idsProducto }, estados: { nombreEstado: ESTADO_RECETA_ACTIVA } },
      include: { receta_item: true },
    });
    const recetaPorProducto = new Map(recetas.map((receta) => [receta.id_producto, receta.receta_item]));

    const consumoPorInsumo = new Map<number, number>();
    for (const item of items) {
      const recetaItems = recetaPorProducto.get(item.id_producto) ?? [];
      for (const recetaItem of recetaItems) {
        const consumo = Number(recetaItem.cantidad_utilizada) * item.cantidad;
        consumoPorInsumo.set(recetaItem.id_insumo, (consumoPorInsumo.get(recetaItem.id_insumo) ?? 0) + consumo);
      }
    }
    if (consumoPorInsumo.size === 0) {
      return [];
    }

    const insumos = await this.prisma.insumo.findMany({
      where: { id_insumo: { in: [...consumoPorInsumo.keys()] } },
    });
    const stockeablePorInsumo = new Map(insumos.map((insumo) => [insumo.id_insumo, insumo.stockeable]));

    return [...consumoPorInsumo.entries()]
      .filter(([idInsumo]) => stockeablePorInsumo.get(idInsumo))
      .map(([idInsumo, cantidad]) => ({
        id_insumo: idInsumo,
        cantidad: Math.round(cantidad * 10000) / 10000,
        cantidadEntera: Math.round(cantidad),
      }));
  }

  // Logística rechaza: el lote vuelve a la pantalla de Producción en
  // estado "Rechazado" con el motivo, para que se corrija y se
  // reenvíe (ver update() de más arriba).
  async rechazar(id: number, dto: RechazarLoteProdDto) {
    const lote = await this.findOne(id);

    if (lote.estados.nombreEstado !== ESTADO_PENDIENTE) {
      throw new BadRequestException('Solo se puede rechazar un lote pendiente de aprobación');
    }

    const idEstadoRechazado = await this.estadosLookup.getId(ESTADO_RECHAZADO);
    return this.prisma.lote_prod.update({
      where: { id_lote: id },
      data: { id_estado: idEstadoRechazado, motivo_rechazo: dto.motivo_rechazo },
    });
  }

  async remove(id: number) {
    const lote = await this.findOne(id);
    if (lote.estados.nombreEstado === ESTADO_APROBADO) {
      throw new BadRequestException('No se puede eliminar un lote de producción ya aprobado');
    }
    return this.prisma.lote_prod.delete({ where: { id_lote: id } });
  }
}
