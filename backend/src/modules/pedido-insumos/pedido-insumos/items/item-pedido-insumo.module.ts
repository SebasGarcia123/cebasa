import { Module } from '@nestjs/common';
import { ItemPedidoInsumoService } from './item-pedido-insumo.service.js';
import { ItemPedidoInsumoController } from './item-pedido-insumo.controller.js';

@Module({
  controllers: [ItemPedidoInsumoController],
  providers: [ItemPedidoInsumoService],
})
export class ItemPedidoInsumoModule {}
