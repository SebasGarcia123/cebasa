import { Module } from '@nestjs/common';
import { TipoMovimientoService } from './tipo-movimiento.service.js';
import { TipoMovimientoController } from './tipo-movimiento.controller.js';

@Module({
  controllers: [TipoMovimientoController],
  providers: [TipoMovimientoService],
  exports: [TipoMovimientoService],
})
export class TipoMovimientoModule {}
