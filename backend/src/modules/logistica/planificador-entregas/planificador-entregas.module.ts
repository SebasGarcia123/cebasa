import { Module } from '@nestjs/common';
import { PlanificadorEntregasService } from './planificador-entregas.service.js';
import { PlanificadorEntregasController } from './planificador-entregas.controller.js';

@Module({
  controllers: [PlanificadorEntregasController],
  providers: [PlanificadorEntregasService],
})
export class PlanificadorEntregasModule {}
