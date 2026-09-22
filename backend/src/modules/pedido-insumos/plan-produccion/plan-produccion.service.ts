import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { EstadosLookupService } from '../../../prisma/estados-lookup.service.js';
import { CreatePlanProduccionDto } from './dto/create-plan-produccion.dto.js';
import { UpdatePlanProduccionDto } from './dto/update-plan-produccion.dto.js';

const ESTADO_ACTIVO = 'Activo';
const ESTADOS_PERMITIDOS = new Set(['Activo', 'Anulado']);

@Injectable()
export class PlanProduccionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly estadosLookup: EstadosLookupService,
  ) {}

  async create(dto: CreatePlanProduccionDto) {
    const idEstadoActivo = await this.estadosLookup.getId(ESTADO_ACTIVO);
    return this.prisma.plan_produccion.create({
      data: {
        ...dto,
        id_estado: idEstadoActivo,
        fecha_inicio_semana: new Date(dto.fecha_inicio_semana),
      },
    });
  }

  findAll() {
    return this.prisma.plan_produccion.findMany({
      include: { usuarios: true, estados: true },
    });
  }

  async findOne(id: number) {
    const plan = await this.prisma.plan_produccion.findUnique({
      where: { id_plan_produccion: id },
      include: {
        usuarios: true,
        estados: true,
        item_plan_produccion: {
          include: { productos: true, lineas: true, turnos: true },
        },
      },
    });
    if (!plan) {
      throw new NotFoundException(`Plan de producción ${id} no encontrado`);
    }
    return plan;
  }

  async update(id: number, dto: UpdatePlanProduccionDto) {
    await this.findOne(id);

    if (dto.id_estado !== undefined) {
      const estado = await this.prisma.estados.findUnique({
        where: { id_estado: dto.id_estado },
      });
      if (!estado || !ESTADOS_PERMITIDOS.has(estado.nombreEstado)) {
        throw new BadRequestException('Un plan de producción solo puede estar Activo o Anulado');
      }
    }

    return this.prisma.plan_produccion.update({
      where: { id_plan_produccion: id },
      data: {
        ...dto,
        fecha_inicio_semana: dto.fecha_inicio_semana
          ? new Date(dto.fecha_inicio_semana)
          : undefined,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.plan_produccion.delete({
      where: { id_plan_produccion: id },
    });
  }
}
