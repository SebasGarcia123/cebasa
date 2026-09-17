import { Module } from '@nestjs/common';
import { PedidosService } from './pedidos.service.js';
import { PedidosController } from './pedidos.controller.js';
import { ItemPedidoModule } from './items/item-pedido.module.js';

@Module({
  imports: [ItemPedidoModule],
  controllers: [PedidosController],
  providers: [PedidosService],
  exports: [PedidosService],
})
export class PedidosModule {}
