import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreateTipoMovimientoDto } from './dto/create-tipo-movimiento.dto.js';
import { UpdateTipoMovimientoDto } from './dto/update-tipo-movimiento.dto.js';

@Injectable()
export class TipoMovimientoService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateTipoMovimientoDto) {
    return this.prisma.tipo_movimiento.create({ data: dto });
  }

  findAll() {
    return this.prisma.tipo_movimiento.findMany({ include: { naturaleza: true, estados: true } });
  }

  async findOne(id: number) {
    const tipoMovimiento = await this.prisma.tipo_movimiento.findUnique({
      where: { id_tipo_movimiento: id },
      include: { naturaleza: true, estados: true },
    });
    if (!tipoMovimiento) {
      throw new NotFoundException(`Tipo de movimiento ${id} no encontrado`);
    }
    return tipoMovimiento;
  }

  async update(id: number, dto: UpdateTipoMovimientoDto) {
    await this.findOne(id);
    return this.prisma.tipo_movimiento.update({ where: { id_tipo_movimiento: id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.tipo_movimiento.delete({ where: { id_tipo_movimiento: id } });
  }
}
