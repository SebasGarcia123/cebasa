import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { CreateRecetaItemDto } from './dto/create-receta-item.dto.js';
import { UpdateRecetaItemDto } from './dto/update-receta-item.dto.js';

@Injectable()
export class RecetaItemService {
  constructor(private readonly prisma: PrismaService) {}

  findAllForReceta(idReceta: number) {
    return this.prisma.receta_item.findMany({
      where: { id_receta: idReceta },
      include: { insumo: true },
    });
  }

  async create(idReceta: number, dto: CreateRecetaItemDto) {
    const existente = await this.prisma.receta_item.findUnique({
      where: { id_receta_id_insumo: { id_receta: idReceta, id_insumo: dto.id_insumo } },
    });
    if (existente) {
      throw new ConflictException('Ese insumo ya está cargado en esta receta');
    }
    return this.prisma.receta_item.create({
      data: { ...dto, id_receta: idReceta },
      include: { insumo: true },
    });
  }

  async findOne(idReceta: number, idItem: number) {
    const item = await this.prisma.receta_item.findFirst({
      where: { id_receta_item: idItem, id_receta: idReceta },
      include: { insumo: true },
    });
    if (!item) {
      throw new NotFoundException(
        `Item ${idItem} no encontrado en la receta ${idReceta}`,
      );
    }
    return item;
  }

  async update(idReceta: number, idItem: number, dto: UpdateRecetaItemDto) {
    await this.findOne(idReceta, idItem);
    if (dto.id_insumo !== undefined) {
      const existente = await this.prisma.receta_item.findUnique({
        where: { id_receta_id_insumo: { id_receta: idReceta, id_insumo: dto.id_insumo } },
      });
      if (existente && existente.id_receta_item !== idItem) {
        throw new ConflictException('Ese insumo ya está cargado en esta receta');
      }
    }
    return this.prisma.receta_item.update({
      where: { id_receta_item: idItem },
      data: dto,
    });
  }

  async remove(idReceta: number, idItem: number) {
    await this.findOne(idReceta, idItem);
    return this.prisma.receta_item.delete({
      where: { id_receta_item: idItem },
    });
  }
}
