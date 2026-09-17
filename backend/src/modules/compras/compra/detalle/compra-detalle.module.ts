import { Module } from '@nestjs/common';
import { CompraDetalleService } from './compra-detalle.service.js';
import { CompraDetalleController } from './compra-detalle.controller.js';

@Module({
  controllers: [CompraDetalleController],
  providers: [CompraDetalleService],
})
export class CompraDetalleModule {}
