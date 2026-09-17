import { Module } from '@nestjs/common';
import { PlanProduccionService } from './plan-produccion.service.js';
import { PlanProduccionController } from './plan-produccion.controller.js';
import { ItemPlanProduccionModule } from './items/item-plan-produccion.module.js';

@Module({
  imports: [ItemPlanProduccionModule],
  controllers: [PlanProduccionController],
  providers: [PlanProduccionService],
  exports: [PlanProduccionService],
})
export class PlanProduccionModule {}
