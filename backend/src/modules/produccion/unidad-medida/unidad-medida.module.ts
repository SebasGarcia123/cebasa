import { Module } from '@nestjs/common';
import { UnidadMedidaService } from './unidad-medida.service.js';
import { UnidadMedidaController } from './unidad-medida.controller.js';

@Module({
  controllers: [UnidadMedidaController],
  providers: [UnidadMedidaService],
  exports: [UnidadMedidaService],
})
export class UnidadMedidaModule {}
