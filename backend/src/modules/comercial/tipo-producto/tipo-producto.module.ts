import { Module } from '@nestjs/common';
import { TipoProductoService } from './tipo-producto.service.js';
import { TipoProductoController } from './tipo-producto.controller.js';

@Module({
  controllers: [TipoProductoController],
  providers: [TipoProductoService],
  exports: [TipoProductoService],
})
export class TipoProductoModule {}
