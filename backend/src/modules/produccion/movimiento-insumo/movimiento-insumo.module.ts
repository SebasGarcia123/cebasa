import { Module } from '@nestjs/common';
import { MovimientoInsumoService } from './movimiento-insumo.service.js';
import { MovimientoInsumoController } from './movimiento-insumo.controller.js';

@Module({
  controllers: [MovimientoInsumoController],
  providers: [MovimientoInsumoService],
})
export class MovimientoInsumoModule {}
