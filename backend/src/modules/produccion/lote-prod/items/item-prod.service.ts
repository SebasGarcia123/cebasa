import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { CreateItemProdDto } from './dto/create-item-prod.dto.js';
import { UpdateItemProdDto } from './dto/update-item-prod.dto.js';

@Injectable()
export class ItemProdService {
  constructor(private readonly prisma: PrismaService) {}

  findAllForLote(idLote: number) {
    return this.prisma.item_prod.findMany({
      where: { id_lote: idLote },
      include: { productos: true, lineas: true },
    });
  }

  create(idLote: number, dto: CreateItemProdDto) {
    return this.prisma.item_prod.create({
      data: { ...dto, id_lote: idLote },
      include: { productos: true, lineas: true },
    });
  }

  async findOne(idLote: number, idItem: number) {
    const item = await this.prisma.item_prod.findFirst({
      where: { id_item: idItem, id_lote: idLote },
      include: { productos: true, lineas: true },
    });
    if (!item) {
      throw new NotFoundException(`Item ${idItem} no encontrado en el lote ${idLote}`);
    }
    return item;
  }

  async update(idLote: number, idItem: number, dto: UpdateItemProdDto) {
    await this.findOne(idLote, idItem);
    return this.prisma.item_prod.update({
      where: { id_item: idItem },
      data: dto,
    });
  }

  async remove(idLote: number, idItem: number) {
    await this.findOne(idLote, idItem);
    return this.prisma.item_prod.delete({ where: { id_item: idItem } });
  }
}
