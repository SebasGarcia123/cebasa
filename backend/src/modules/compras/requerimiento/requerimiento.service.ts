import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { EstadosLookupService } from '../../../prisma/estados-lookup.service.js';
import { CreateRequerimientoDto } from './dto/create-requerimiento.dto.js';
import { UpdateRequerimientoDto } from './dto/update-requerimiento.dto.js';

const ESTADO_ACTIVO = 'Activo';

@Injectable()
export class RequerimientoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly estadosLookup: EstadosLookupService,
  ) {}

  async create(dto: CreateRequerimientoDto) {
    const idEstadoActivo = await this.estadosLookup.getId(ESTADO_ACTIVO);
    return this.prisma.requerimiento.create({
      data: {
        ...dto,
        fecha_carga: new Date(),
        fecha_necesidad: new Date(dto.fecha_necesidad),
        id_estado: idEstadoActivo,
      },
    });
  }

  findAll() {
    return this.prisma.requerimiento.findMany({
      include: { usuarios: true, estados: true },
    });
  }

  async findOne(id: number) {
    const requerimiento = await this.prisma.requerimiento.findUnique({
      where: { id_requerimiento: id },
      include: {
        usuarios: true,
        estados: true,
        requerimiento_detalle: { include: { insumo: true } },
      },
    });
    if (!requerimiento) {
      throw new NotFoundException(`Requerimiento ${id} no encontrado`);
    }
    return requerimiento;
  }

  async update(id: number, dto: UpdateRequerimientoDto) {
    await this.findOne(id);
    return this.prisma.requerimiento.update({
      where: { id_requerimiento: id },
      data: {
        ...dto,
        fecha_necesidad: dto.fecha_necesidad
          ? new Date(dto.fecha_necesidad)
          : undefined,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.requerimiento.delete({
      where: { id_requerimiento: id },
    });
  }
}
