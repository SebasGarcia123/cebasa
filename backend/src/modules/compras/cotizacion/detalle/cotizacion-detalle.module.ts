import { Module } from '@nestjs/common';
import { CotizacionDetalleService } from './cotizacion-detalle.service.js';
import { CotizacionDetalleController } from './cotizacion-detalle.controller.js';

@Module({
  controllers: [CotizacionDetalleController],
  providers: [CotizacionDetalleService],
})
export class CotizacionDetalleModule {}
