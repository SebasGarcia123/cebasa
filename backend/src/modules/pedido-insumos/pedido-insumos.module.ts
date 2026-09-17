import { Module } from '@nestjs/common';
import { PedidoInsumosEntityModule } from './pedido-insumos/pedido-insumos.module.js';
import { PlanProduccionModule } from './plan-produccion/plan-produccion.module.js';

@Module({
  imports: [PedidoInsumosEntityModule, PlanProduccionModule],
})
export class PedidoInsumosModule {}
