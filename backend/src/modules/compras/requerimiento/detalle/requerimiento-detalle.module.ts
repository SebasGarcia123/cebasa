import { Module } from '@nestjs/common';
import { RequerimientoDetalleService } from './requerimiento-detalle.service.js';
import { RequerimientoDetalleController } from './requerimiento-detalle.controller.js';

@Module({
  controllers: [RequerimientoDetalleController],
  providers: [RequerimientoDetalleService],
})
export class RequerimientoDetalleModule {}
