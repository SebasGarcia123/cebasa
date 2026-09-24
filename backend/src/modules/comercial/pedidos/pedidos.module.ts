import { Module } from '@nestjs/common';
import { PedidosService } from './pedidos.service.js';
import { PedidosController } from './pedidos.controller.js';
import { RemitoPdfService } from './remito-pdf.service.js';
import { ItemPedidoModule } from './items/item-pedido.module.js';

@Module({
  imports: [ItemPedidoModule],
  controllers: [PedidosController],
  providers: [PedidosService, RemitoPdfService],
  exports: [PedidosService],
})
export class PedidosModule {}
