import { Module } from '@nestjs/common';
import { DevolucionInsumosService } from './devolucion-insumos.service.js';
import { DevolucionInsumosController } from './devolucion-insumos.controller.js';

@Module({
  controllers: [DevolucionInsumosController],
  providers: [DevolucionInsumosService],
  exports: [DevolucionInsumosService],
})
export class DevolucionInsumosModule {}
