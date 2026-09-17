import { Module } from '@nestjs/common';
import { PedidoInsumosService } from './pedido-insumos.service.js';
import { PedidoInsumosController } from './pedido-insumos.controller.js';
import { ItemPedidoInsumoModule } from './items/item-pedido-insumo.module.js';

@Module({
  imports: [ItemPedidoInsumoModule],
  controllers: [PedidoInsumosController],
  providers: [PedidoInsumosService],
  exports: [PedidoInsumosService],
})
export class PedidoInsumosEntityModule {}
