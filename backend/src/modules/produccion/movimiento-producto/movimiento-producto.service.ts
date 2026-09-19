import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreateMovimientoProductoDto } from './dto/create-movimiento-producto.dto.js';
import { UpdateMovimientoProductoDto } from './dto/update-movimiento-producto.dto.js';

@Injectable()
export class MovimientoProductoService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateMovimientoProductoDto) {
    return this.prisma.movimiento_producto.create({
      data: { ...dto, fecha_movimiento: new Date(dto.fecha_movimiento) },
    });
  }

  findAll() {
    return this.prisma.movimiento_producto.findMany({
      include: {
        productos: true,
        tipo_movimiento: true,
        deposito_origen: true,
        deposito_destino: true,
      },
    });
  }

  async findOne(id: number) {
    const movimiento = await this.prisma.movimiento_producto.findUnique({
      where: { id_movimiento_producto: id },
      include: {
        productos: true,
        tipo_movimiento: true,
        deposito_origen: true,
        deposito_destino: true,
        estados: true,
      },
    });
    if (!movimiento) {
      throw new NotFoundException(`Movimiento de producto ${id} no encontrado`);
    }
    return movimiento;
  }

  async update(id: number, dto: UpdateMovimientoProductoDto) {
    await this.findOne(id);
    return this.prisma.movimiento_producto.update({
      where: { id_movimiento_producto: id },
      data: {
        ...dto,
        fecha_movimiento: dto.fecha_movimiento
          ? new Date(dto.fecha_movimiento)
          : undefined,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.movimiento_producto.delete({
      where: { id_movimiento_producto: id },
    });
  }
}
