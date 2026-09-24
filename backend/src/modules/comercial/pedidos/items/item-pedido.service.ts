import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { CreateItemPedidoDto } from './dto/create-item-pedido.dto.js';
import { UpdateItemPedidoDto } from './dto/update-item-pedido.dto.js';

const ESTADO_CARGADO = 'Cargado';

@Injectable()
export class ItemPedidoService {
  constructor(private readonly prisma: PrismaService) {}

  findAllForPedido(idPedido: number) {
    return this.prisma.item_pedido.findMany({
      where: { id_pedido: idPedido },
      include: { productos: true },
    });
  }

  async create(idPedido: number, dto: CreateItemPedidoDto) {
    await this.assertPedidoEditable(idPedido);
    return this.prisma.item_pedido.create({
      data: { ...dto, id_pedido: idPedido },
      include: { productos: true },
    });
  }

  async findOne(idPedido: number, idItem: number) {
    const item = await this.prisma.item_pedido.findFirst({
      where: { id_item_pedido: idItem, id_pedido: idPedido },
      include: { productos: true },
    });
    if (!item) {
      throw new NotFoundException(
        `Item ${idItem} no encontrado en el pedido ${idPedido}`,
      );
    }
    return item;
  }

  async update(idPedido: number, idItem: number, dto: UpdateItemPedidoDto) {
    await this.assertPedidoEditable(idPedido);
    await this.findOne(idPedido, idItem);
    return this.prisma.item_pedido.update({
      where: { id_item_pedido: idItem },
      data: dto,
    });
  }

  async remove(idPedido: number, idItem: number) {
    await this.assertPedidoEditable(idPedido);
    await this.findOne(idPedido, idItem);
    return this.prisma.item_pedido.delete({
      where: { id_item_pedido: idItem },
    });
  }

  // Una vez facturado el pedido, sus ítems quedan fijos (ver
  // PedidosService.assertEditable, mismo criterio).
  private async assertPedidoEditable(idPedido: number): Promise<void> {
    const pedido = await this.prisma.pedidos.findUnique({
      where: { id_pedido: idPedido },
      include: { estados: true },
    });
    if (!pedido) {
      throw new NotFoundException(`Pedido ${idPedido} no encontrado`);
    }
    if (pedido.estados.nombreEstado !== ESTADO_CARGADO) {
      throw new BadRequestException('Un pedido solo se puede editar mientras está Cargado');
    }
  }
}
