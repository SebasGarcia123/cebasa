import { Module } from '@nestjs/common';
import { AutoelevadoresService } from './autoelevadores.service.js';
import { AutoelevadoresController } from './autoelevadores.controller.js';
import { ServiciosAutoelevadorModule } from './servicios/servicios.module.js';

@Module({
  imports: [ServiciosAutoelevadorModule],
  controllers: [AutoelevadoresController],
  providers: [AutoelevadoresService],
  exports: [AutoelevadoresService],
})
export class AutoelevadoresModule {}
