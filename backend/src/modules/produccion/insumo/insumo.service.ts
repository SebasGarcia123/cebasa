import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreateInsumoDto } from './dto/create-insumo.dto.js';
import { UpdateInsumoDto } from './dto/update-insumo.dto.js';

@Injectable()
export class InsumoService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateInsumoDto) {
    return this.prisma.insumo.create({ data: dto });
  }

  findAll() {
    return this.prisma.insumo.findMany({
      include: { unidad_medida: true, estados: true },
    });
  }

  async findOne(id: number) {
    const insumo = await this.prisma.insumo.findUnique({
      where: { id_insumo: id },
      include: {
        unidad_medida: true,
        estados: true,
        stock_insumo_deposito: { include: { deposito: true } },
      },
    });
    if (!insumo) {
      throw new NotFoundException(`Insumo ${id} no encontrado`);
    }
    return insumo;
  }

  async update(id: number, dto: UpdateInsumoDto) {
    await this.findOne(id);
    return this.prisma.insumo.update({ where: { id_insumo: id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.insumo.delete({ where: { id_insumo: id } });
  }
}
