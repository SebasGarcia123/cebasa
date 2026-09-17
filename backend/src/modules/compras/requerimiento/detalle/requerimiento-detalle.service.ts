import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { CreateRequerimientoDetalleDto } from './dto/create-requerimiento-detalle.dto.js';
import { UpdateRequerimientoDetalleDto } from './dto/update-requerimiento-detalle.dto.js';

@Injectable()
export class RequerimientoDetalleService {
  constructor(private readonly prisma: PrismaService) {}

  findAllForRequerimiento(idRequerimiento: number) {
    return this.prisma.requerimiento_detalle.findMany({
      where: { id_requerimiento: idRequerimiento },
      include: { insumo: true },
    });
  }

  create(idRequerimiento: number, dto: CreateRequerimientoDetalleDto) {
    return this.prisma.requerimiento_detalle.create({
      data: { ...dto, id_requerimiento: idRequerimiento },
      include: { insumo: true },
    });
  }

  async findOne(idRequerimiento: number, idDetalle: number) {
    const detalle = await this.prisma.requerimiento_detalle.findFirst({
      where: { id_requerimiento_detalle: idDetalle, id_requerimiento: idRequerimiento },
      include: { insumo: true },
    });
    if (!detalle) {
      throw new NotFoundException(
        `Detalle ${idDetalle} no encontrado en el requerimiento ${idRequerimiento}`,
      );
    }
    return detalle;
  }

  async update(idRequerimiento: number, idDetalle: number, dto: UpdateRequerimientoDetalleDto) {
    await this.findOne(idRequerimiento, idDetalle);
    return this.prisma.requerimiento_detalle.update({
      where: { id_requerimiento_detalle: idDetalle },
      data: dto,
    });
  }

  async remove(idRequerimiento: number, idDetalle: number) {
    await this.findOne(idRequerimiento, idDetalle);
    return this.prisma.requerimiento_detalle.delete({
      where: { id_requerimiento_detalle: idDetalle },
    });
  }
}
