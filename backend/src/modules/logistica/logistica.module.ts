import { Module } from '@nestjs/common';
import { FleteroModule } from './fletero/fletero.module.js';
import { TipoLoteModule } from './tipo-lote/tipo-lote.module.js';
import { TransporteModule } from './transporte/transporte.module.js';
import { LotesModule } from './lotes/lotes.module.js';
import { AutoelevadoresModule } from './autoelevadores/autoelevadores.module.js';
import { ControlesAutoelevadorModule } from './controles-autoelevador/controles.module.js';

@Module({
  imports: [
    FleteroModule,
    TipoLoteModule,
    TransporteModule,
    LotesModule,
    AutoelevadoresModule,
    ControlesAutoelevadorModule,
  ],
})
export class LogisticaModule {}
