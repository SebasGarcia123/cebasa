import { Module } from '@nestjs/common';
import { CuentaCorrienteService } from './cuenta-corriente.service.js';
import { CuentaCorrienteController } from './cuenta-corriente.controller.js';
import { MovimientosCuentaCorrienteModule } from './movimientos/movimientos.module.js';

@Module({
  imports: [MovimientosCuentaCorrienteModule],
  controllers: [CuentaCorrienteController],
  providers: [CuentaCorrienteService],
})
export class CuentaCorrienteModule {}
