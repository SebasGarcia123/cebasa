import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreateRecetaDto } from './dto/create-receta.dto.js';
import { UpdateRecetaDto } from './dto/update-receta.dto.js';

@Injectable()
export class RecetaService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateRecetaDto) {
    return this.prisma.receta.create({ data: dto });
  }

  findAll() {
    return this.prisma.receta.findMany({
      include: { productos: true, estados: true },
    });
  }

  async findOne(id: number) {
    const receta = await this.prisma.receta.findUnique({
      where: { id_receta: id },
      include: {
        productos: true,
        estados: true,
        receta_item: { include: { insumo: true } },
      },
    });
    if (!receta) {
      throw new NotFoundException(`Receta ${id} no encontrada`);
    }
    return receta;
  }

  async update(id: number, dto: UpdateRecetaDto) {
    await this.findOne(id);
    return this.prisma.receta.update({ where: { id_receta: id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.receta.delete({ where: { id_receta: id } });
  }
}
