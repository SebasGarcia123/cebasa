import { Module } from '@nestjs/common';
import { DireccionesService } from './direcciones.service.js';
import { DireccionesController } from './direcciones.controller.js';

@Module({
  controllers: [DireccionesController],
  providers: [DireccionesService],
  exports: [DireccionesService],
})
export class DireccionesModule {}
