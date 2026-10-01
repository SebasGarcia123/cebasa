import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { CreateItemPedidoInsumoDto } from './dto/create-item-pedido-insumo.dto.js';
import { UpdateItemPedidoInsumoDto } from './dto/update-item-pedido-insumo.dto.js';

const ESTADOS_EDITABLES = new Set(['Pendiente', 'Rechazado']);
const INCLUDE_ITEM = { insumo: { include: { unidad_medida: true } }, lineas: true } as const;

@Injectable()
export class ItemPedidoInsumoService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertPedidoEditable(idPedido: number) {
    const pedido = await this.prisma.pedido_insumos.findUnique({ where: { id_pedido_insumos: idPedido }, include: { estados: true } });
    if (!pedido) {
      throw new NotFoundException(`Pedido de insumos ${idPedido} no encontrado`);
    }
    if (!ESTADOS_EDITABLES.has(pedido.estados.nombreEstado)) {
      throw new BadRequestException('Los ítems solo se pueden editar mientras el pedido está Pendiente o Rechazado');
    }
  }

  findAllForPedido(idPedido: number) {
    return this.prisma.item_pedido_insumo.findMany({
      where: { id_pedido_insumos: idPedido },
      include: INCLUDE_ITEM,
    });
  }

  async create(idPedido: number, dto: CreateItemPedidoInsumoDto) {
    await this.assertPedidoEditable(idPedido);
    return this.prisma.item_pedido_insumo.create({
      data: { ...dto, id_pedido_insumos: idPedido },
      include: INCLUDE_ITEM,
    });
  }

  async findOne(idPedido: number, idItem: number) {
    const item = await this.prisma.item_pedido_insumo.findFirst({
      where: { id_item_pedido_insumo: idItem, id_pedido_insumos: idPedido },
      include: INCLUDE_ITEM,
    });
    if (!item) {
      throw new NotFoundException(`Ítem ${idItem} no encontrado en el pedido de insumos ${idPedido}`);
    }
    return item;
  }

  async update(idPedido: number, idItem: number, dto: UpdateItemPedidoInsumoDto) {
    await this.assertPedidoEditable(idPedido);
    await this.findOne(idPedido, idItem);
    return this.prisma.item_pedido_insumo.update({
      where: { id_item_pedido_insumo: idItem },
      data: dto,
      include: INCLUDE_ITEM,
    });
  }

  async remove(idPedido: number, idItem: number) {
    await this.assertPedidoEditable(idPedido);
    await this.findOne(idPedido, idItem);
    return this.prisma.item_pedido_insumo.delete({ where: { id_item_pedido_insumo: idItem } });
  }
}
