import { Module } from '@nestjs/common';
import { CompraService } from './compra.service.js';
import { CompraController } from './compra.controller.js';
import { CompraDetalleModule } from './detalle/compra-detalle.module.js';

@Module({
  imports: [CompraDetalleModule],
  controllers: [CompraController],
  providers: [CompraService],
  exports: [CompraService],
})
export class CompraModule {}
