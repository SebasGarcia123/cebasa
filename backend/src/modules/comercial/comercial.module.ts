import { Module } from '@nestjs/common';
import { TipoImpactoModule } from './tipo-impacto/tipo-impacto.module.js';
import { TipoDocumentoModule } from './tipo-documento/tipo-documento.module.js';
import { ClientesModule } from './clientes/clientes.module.js';
import { PedidosModule } from './pedidos/pedidos.module.js';
import { ProductosModule } from './productos/productos.module.js';
import { ReclamosModule } from './reclamos/reclamos.module.js';
import { TipoProductoModule } from './tipo-producto/tipo-producto.module.js';

@Module({
  imports: [
    TipoImpactoModule,
    TipoDocumentoModule,
    ClientesModule,
    PedidosModule,
    ProductosModule,
    ReclamosModule,
    TipoProductoModule,
  ],
})
export class ComercialModule {}
