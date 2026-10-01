import { Module } from '@nestjs/common';
import { FleteroModule } from './fletero/fletero.module.js';
import { TipoLoteModule } from './tipo-lote/tipo-lote.module.js';
import { TransporteModule } from './transporte/transporte.module.js';
import { LotesModule } from './lotes/lotes.module.js';
import { AutoelevadoresModule } from './autoelevadores/autoelevadores.module.js';
import { ControlesAutoelevadorModule } from './controles-autoelevador/controles.module.js';
import { PlanificadorEntregasModule } from './planificador-entregas/planificador-entregas.module.js';
import { CargaPedidosModule } from './carga-pedidos/carga-pedidos.module.js';

@Module({
  imports: [
    FleteroModule,
    TipoLoteModule,
    TransporteModule,
    LotesModule,
    AutoelevadoresModule,
    ControlesAutoelevadorModule,
    PlanificadorEntregasModule,
    CargaPedidosModule,
  ],
})
export class LogisticaModule {}
