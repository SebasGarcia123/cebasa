import { Module } from '@nestjs/common';
import { RequerimientoService } from './requerimiento.service.js';
import { RequerimientoController } from './requerimiento.controller.js';
import { RequerimientoDetalleModule } from './detalle/requerimiento-detalle.module.js';

@Module({
  imports: [RequerimientoDetalleModule],
  controllers: [RequerimientoController],
  providers: [RequerimientoService],
  exports: [RequerimientoService],
})
export class RequerimientoModule {}
