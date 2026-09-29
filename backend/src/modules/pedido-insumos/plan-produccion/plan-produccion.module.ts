import { Module } from '@nestjs/common';
import { PlanProduccionService } from './plan-produccion.service.js';
import { PlanProduccionController } from './plan-produccion.controller.js';
import { ItemPlanProduccionService } from './items/item-plan-produccion.service.js';
import { ItemPlanProduccionController } from './items/item-plan-produccion.controller.js';
import { DiaNoLaborableService } from './dias-no-laborables/dia-no-laborable.service.js';
import { DiaNoLaborableController } from './dias-no-laborables/dia-no-laborable.controller.js';

// Módulo único (no uno por sub-entidad): ItemPlanProduccionService y
// DiaNoLaborableService dependen de PlanProduccionService
// (obtenerOCrearPlan), así que quedan todos en el mismo contenedor de
// DI en vez de andar exportando/importando entre sub-módulos.
@Module({
  controllers: [PlanProduccionController, ItemPlanProduccionController, DiaNoLaborableController],
  providers: [PlanProduccionService, ItemPlanProduccionService, DiaNoLaborableService],
})
export class PlanProduccionModule {}
