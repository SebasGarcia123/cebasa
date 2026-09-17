import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreateCotizacionDto } from './dto/create-cotizacion.dto.js';
import { UpdateCotizacionDto } from './dto/update-cotizacion.dto.js';

@Injectable()
export class CotizacionService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateCotizacionDto) {
    return this.prisma.cotizacion.create({
      data: { ...dto, fecha_cotizacion: new Date(dto.fecha_cotizacion) },
    });
  }

  findAll() {
    return this.prisma.cotizacion.findMany({
      include: { proveedor: true, estados: true, archivo_adjunto: true },
    });
  }

  async findOne(id: number) {
    const cotizacion = await this.prisma.cotizacion.findUnique({
      where: { id_cotizacion: id },
      include: {
        proveedor: true,
        estados: true,
        archivo_adjunto: true,
        cotizacion_detalle: { include: { requerimiento_detalle: true } },
      },
    });
    if (!cotizacion) {
      throw new NotFoundException(`Cotización ${id} no encontrada`);
    }
    return cotizacion;
  }

  async update(id: number, dto: UpdateCotizacionDto) {
    await this.findOne(id);
    return this.prisma.cotizacion.update({
      where: { id_cotizacion: id },
      data: {
        ...dto,
        fecha_cotizacion: dto.fecha_cotizacion ? new Date(dto.fecha_cotizacion) : undefined,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.cotizacion.delete({ where: { id_cotizacion: id } });
  }
}
