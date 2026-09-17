import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { CreateItemPedidoInsumoDto } from './dto/create-item-pedido-insumo.dto.js';
import { UpdateItemPedidoInsumoDto } from './dto/update-item-pedido-insumo.dto.js';

@Injectable()
export class ItemPedidoInsumoService {
  constructor(private readonly prisma: PrismaService) {}

  findAllForPedido(idPedido: number) {
    return this.prisma.item_pedido_insumo.findMany({
      where: { id_pedido_insumos: idPedido },
      include: { insumo: true },
    });
  }

  create(idPedido: number, dto: CreateItemPedidoInsumoDto) {
    return this.prisma.item_pedido_insumo.create({
      data: { ...dto, id_pedido_insumos: idPedido },
      include: { insumo: true },
    });
  }

  async findOne(idPedido: number, idItem: number) {
    const item = await this.prisma.item_pedido_insumo.findFirst({
      where: { id_item_pedido_insumo: idItem, id_pedido_insumos: idPedido },
      include: { insumo: true },
    });
    if (!item) {
      throw new NotFoundException(`Item ${idItem} no encontrado en el pedido de insumos ${idPedido}`);
    }
    return item;
  }

  async update(idPedido: number, idItem: number, dto: UpdateItemPedidoInsumoDto) {
    await this.findOne(idPedido, idItem);
    return this.prisma.item_pedido_insumo.update({
      where: { id_item_pedido_insumo: idItem },
      data: dto,
    });
  }

  async remove(idPedido: number, idItem: number) {
    await this.findOne(idPedido, idItem);
    return this.prisma.item_pedido_insumo.delete({ where: { id_item_pedido_insumo: idItem } });
  }
}
