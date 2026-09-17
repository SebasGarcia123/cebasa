import { Module } from '@nestjs/common';
import { TipoLoteService } from './tipo-lote.service.js';
import { TipoLoteController } from './tipo-lote.controller.js';

@Module({
  controllers: [TipoLoteController],
  providers: [TipoLoteService],
  exports: [TipoLoteService],
})
export class TipoLoteModule {}
