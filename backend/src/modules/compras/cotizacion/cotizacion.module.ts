import { Module } from '@nestjs/common';
import { CotizacionService } from './cotizacion.service.js';
import { CotizacionController } from './cotizacion.controller.js';
import { CotizacionDetalleModule } from './detalle/cotizacion-detalle.module.js';

@Module({
  imports: [CotizacionDetalleModule],
  controllers: [CotizacionController],
  providers: [CotizacionService],
  exports: [CotizacionService],
})
export class CotizacionModule {}
