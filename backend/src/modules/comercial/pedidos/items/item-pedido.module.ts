import { Module } from '@nestjs/common';
import { ItemPedidoService } from './item-pedido.service.js';
import { ItemPedidoController } from './item-pedido.controller.js';

@Module({
  controllers: [ItemPedidoController],
  providers: [ItemPedidoService],
})
export class ItemPedidoModule {}
