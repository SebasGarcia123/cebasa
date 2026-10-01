import { Module } from '@nestjs/common';
import { PedidoInsumosEntityModule } from './pedido-insumos/pedido-insumos.module.js';
import { PlanProduccionModule } from './plan-produccion/plan-produccion.module.js';
import { DevolucionInsumosModule } from './devolucion-insumos/devolucion-insumos.module.js';

@Module({
  imports: [PedidoInsumosEntityModule, PlanProduccionModule, DevolucionInsumosModule],
})
export class PedidoInsumosModule {}
