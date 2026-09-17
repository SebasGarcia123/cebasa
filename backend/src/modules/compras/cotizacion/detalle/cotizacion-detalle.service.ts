import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { CreateCotizacionDetalleDto } from './dto/create-cotizacion-detalle.dto.js';
import { UpdateCotizacionDetalleDto } from './dto/update-cotizacion-detalle.dto.js';

@Injectable()
export class CotizacionDetalleService {
  constructor(private readonly prisma: PrismaService) {}

  findAllForCotizacion(idCotizacion: number) {
    return this.prisma.cotizacion_detalle.findMany({
      where: { id_cotizacion: idCotizacion },
      include: { requerimiento_detalle: true },
    });
  }

  create(idCotizacion: number, dto: CreateCotizacionDetalleDto) {
    return this.prisma.cotizacion_detalle.create({
      data: { ...dto, id_cotizacion: idCotizacion },
      include: { requerimiento_detalle: true },
    });
  }

  async findOne(idCotizacion: number, idDetalle: number) {
    const detalle = await this.prisma.cotizacion_detalle.findFirst({
      where: { id_cotizacion_detalle: idDetalle, id_cotizacion: idCotizacion },
      include: { requerimiento_detalle: true },
    });
    if (!detalle) {
      throw new NotFoundException(
        `Detalle ${idDetalle} no encontrado en la cotización ${idCotizacion}`,
      );
    }
    return detalle;
  }

  async update(idCotizacion: number, idDetalle: number, dto: UpdateCotizacionDetalleDto) {
    await this.findOne(idCotizacion, idDetalle);
    return this.prisma.cotizacion_detalle.update({
      where: { id_cotizacion_detalle: idDetalle },
      data: dto,
    });
  }

  async remove(idCotizacion: number, idDetalle: number) {
    await this.findOne(idCotizacion, idDetalle);
    return this.prisma.cotizacion_detalle.delete({
      where: { id_cotizacion_detalle: idDetalle },
    });
  }
}
