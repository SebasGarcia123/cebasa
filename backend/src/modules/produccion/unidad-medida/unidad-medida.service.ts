import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreateUnidadMedidaDto } from './dto/create-unidad-medida.dto.js';
import { UpdateUnidadMedidaDto } from './dto/update-unidad-medida.dto.js';

@Injectable()
export class UnidadMedidaService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateUnidadMedidaDto) {
    return this.prisma.unidad_medida.create({ data: dto });
  }

  findAll() {
    return this.prisma.unidad_medida.findMany();
  }

  async findOne(id: number) {
    const unidad = await this.prisma.unidad_medida.findUnique({
      where: { id_unidad_medida: id },
    });
    if (!unidad) {
      throw new NotFoundException(`Unidad de medida ${id} no encontrada`);
    }
    return unidad;
  }

  async update(id: number, dto: UpdateUnidadMedidaDto) {
    await this.findOne(id);
    return this.prisma.unidad_medida.update({ where: { id_unidad_medida: id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.unidad_medida.delete({ where: { id_unidad_medida: id } });
  }
}
