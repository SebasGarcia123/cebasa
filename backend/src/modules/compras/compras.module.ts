import { Module } from '@nestjs/common';
import { ProveedorModule } from './proveedor/proveedor.module.js';
import { ArchivoAdjuntoModule } from './archivo-adjunto/archivo-adjunto.module.js';
import { RequerimientoModule } from './requerimiento/requerimiento.module.js';
import { CotizacionModule } from './cotizacion/cotizacion.module.js';
import { CompraModule } from './compra/compra.module.js';

@Module({
  imports: [
    ProveedorModule,
    ArchivoAdjuntoModule,
    RequerimientoModule,
    CotizacionModule,
    CompraModule,
  ],
})
export class ComprasModule {}
