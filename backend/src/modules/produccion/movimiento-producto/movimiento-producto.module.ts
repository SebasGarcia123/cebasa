import { Module } from '@nestjs/common';
import { MovimientoProductoService } from './movimiento-producto.service.js';
import { MovimientoProductoController } from './movimiento-producto.controller.js';

@Module({
  controllers: [MovimientoProductoController],
  providers: [MovimientoProductoService],
})
export class MovimientoProductoModule {}
