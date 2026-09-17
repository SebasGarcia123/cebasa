import { Module } from '@nestjs/common';
import { ItemPlanProduccionService } from './item-plan-produccion.service.js';
import { ItemPlanProduccionController } from './item-plan-produccion.controller.js';

@Module({
  controllers: [ItemPlanProduccionController],
  providers: [ItemPlanProduccionService],
})
export class ItemPlanProduccionModule {}
