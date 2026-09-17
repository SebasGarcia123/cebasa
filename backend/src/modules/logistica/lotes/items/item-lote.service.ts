import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { CreateItemLoteDto } from './dto/create-item-lote.dto.js';
import { UpdateItemLoteDto } from './dto/update-item-lote.dto.js';

@Injectable()
export class ItemLoteService {
  constructor(private readonly prisma: PrismaService) {}

  findAllForLote(idLote: number) {
    return this.prisma.item_lote.findMany({
      where: { id_lote: idLote },
      include: { unidad_medida: true },
    });
  }

  create(idLote: number, dto: CreateItemLoteDto) {
    return this.prisma.item_lote.create({
      data: { ...dto, id_lote: idLote },
      include: { unidad_medida: true },
    });
  }

  async findOne(idLote: number, idItem: number) {
    const item = await this.prisma.item_lote.findFirst({
      where: { id_item_lote: idItem, id_lote: idLote },
      include: { unidad_medida: true },
    });
    if (!item) {
      throw new NotFoundException(`Item ${idItem} no encontrado en el lote ${idLote}`);
    }
    return item;
  }

  async update(idLote: number, idItem: number, dto: UpdateItemLoteDto) {
    await this.findOne(idLote, idItem);
    return this.prisma.item_lote.update({
      where: { id_item_lote: idItem },
      data: dto,
    });
  }

  async remove(idLote: number, idItem: number) {
    await this.findOne(idLote, idItem);
    return this.prisma.item_lote.delete({ where: { id_item_lote: idItem } });
  }
}
