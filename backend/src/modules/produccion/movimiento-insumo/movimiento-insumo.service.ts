import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreateMovimientoInsumoDto } from './dto/create-movimiento-insumo.dto.js';
import { UpdateMovimientoInsumoDto } from './dto/update-movimiento-insumo.dto.js';

@Injectable()
export class MovimientoInsumoService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateMovimientoInsumoDto) {
    return this.prisma.movimiento_insumo.create({
      data: { ...dto, fecha_movimiento: new Date(dto.fecha_movimiento) },
    });
  }

  findAll() {
    return this.prisma.movimiento_insumo.findMany({
      include: {
        insumo: true,
        tipo_movimiento: true,
        deposito_origen: true,
        deposito_destino: true,
        estados: true,
      },
    });
  }

  async findOne(id: number) {
    const movimiento = await this.prisma.movimiento_insumo.findUnique({
      where: { id_movimiento_insumo: id },
      include: {
        insumo: true,
        tipo_movimiento: true,
        deposito_origen: true,
        deposito_destino: true,
        estados: true,
      },
    });
    if (!movimiento) {
      throw new NotFoundException(`Movimiento de insumo ${id} no encontrado`);
    }
    return movimiento;
  }

  async update(id: number, dto: UpdateMovimientoInsumoDto) {
    await this.findOne(id);
    return this.prisma.movimiento_insumo.update({
      where: { id_movimiento_insumo: id },
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
    return this.prisma.movimiento_insumo.delete({
      where: { id_movimiento_insumo: id },
    });
  }
}
