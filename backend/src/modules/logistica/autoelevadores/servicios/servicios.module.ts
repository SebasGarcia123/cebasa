import { Module } from '@nestjs/common';
import { ServiciosAutoelevadorService } from './servicios.service.js';
import { ServiciosAutoelevadorController } from './servicios.controller.js';

@Module({
  controllers: [ServiciosAutoelevadorController],
  providers: [ServiciosAutoelevadorService],
})
export class ServiciosAutoelevadorModule {}
