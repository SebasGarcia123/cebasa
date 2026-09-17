import { Module } from '@nestjs/common';
import { UnidadMedidaModule } from './unidad-medida/unidad-medida.module.js';
import { DepositoModule } from './deposito/deposito.module.js';
import { NaturalezaModule } from './naturaleza/naturaleza.module.js';
import { LineasModule } from './lineas/lineas.module.js';
import { TurnosModule } from './turnos/turnos.module.js';
import { TipoMovimientoModule } from './tipo-movimiento/tipo-movimiento.module.js';
import { InsumoModule } from './insumo/insumo.module.js';
import { RecetaModule } from './receta/receta.module.js';
import { LoteProdModule } from './lote-prod/lote-prod.module.js';
import { MovimientoInsumoModule } from './movimiento-insumo/movimiento-insumo.module.js';
import { MovimientoProductoModule } from './movimiento-producto/movimiento-producto.module.js';

@Module({
  imports: [
    UnidadMedidaModule,
    DepositoModule,
    NaturalezaModule,
    LineasModule,
    TurnosModule,
    TipoMovimientoModule,
    InsumoModule,
    RecetaModule,
    LoteProdModule,
    MovimientoInsumoModule,
    MovimientoProductoModule,
  ],
})
export class ProduccionModule {}
