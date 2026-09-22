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
const TIPO_MOVIMIENTO_INGRESO_PRODUCCION = 'Ingreso por producción';

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
      include: { turnos: true, estados: true },
    });
  }

  async findOne(id: number) {
    const lote = await this.prisma.lote_prod.findUnique({
      where: { id_lote: id },
      include: {
        turnos: true,
        estados: true,
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

  // Logística aprueba: el lote pasa a "Aprobado" y cada ítem suma su
  // cantidad al stock del producto, dejando además un movimiento de
  // producto como constancia del ingreso.
  async aprobar(id: number) {
    const lote = await this.findOne(id);

    if (lote.estados.nombreEstado !== ESTADO_PENDIENTE) {
      throw new BadRequestException('Solo se puede aprobar un lote pendiente de aprobación');
    }

    const [idEstadoAprobado, idEstadoActivo, tipoMovimiento] = await Promise.all([
      this.estadosLookup.getId(ESTADO_APROBADO),
      this.estadosLookup.getId(ESTADO_ACTIVO),
      this.prisma.tipo_movimiento.findFirst({
        where: { nombre_movimiento: TIPO_MOVIMIENTO_INGRESO_PRODUCCION },
      }),
    ]);
    if (!tipoMovimiento) {
      throw new BadRequestException(
        `No existe el tipo de movimiento "${TIPO_MOVIMIENTO_INGRESO_PRODUCCION}" en el catálogo`,
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
            id_tipo_movimiento: tipoMovimiento.id_tipo_movimiento,
            cantidad: item.cantidad,
            fecha_movimiento: fechaMovimiento,
            id_estado: idEstadoActivo,
            motivo: `Ingreso por aprobación del lote de producción #${id}`,
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
