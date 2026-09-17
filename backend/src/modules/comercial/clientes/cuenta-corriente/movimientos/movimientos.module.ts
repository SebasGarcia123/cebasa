import { Module } from '@nestjs/common';
import { MovimientosCuentaCorrienteService } from './movimientos.service.js';
import { MovimientosCuentaCorrienteController } from './movimientos.controller.js';

@Module({
  controllers: [MovimientosCuentaCorrienteController],
  providers: [MovimientosCuentaCorrienteService],
})
export class MovimientosCuentaCorrienteModule {}
