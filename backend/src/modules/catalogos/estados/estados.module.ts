import { Module } from '@nestjs/common';
import { EstadosService } from './estados.service.js';
import { EstadosController } from './estados.controller.js';

@Module({
  controllers: [EstadosController],
  providers: [EstadosService],
  exports: [EstadosService],
})
export class EstadosModule {}
