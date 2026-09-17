import { Module } from '@nestjs/common';
import { LotesService } from './lotes.service.js';
import { LotesController } from './lotes.controller.js';
import { ItemLoteModule } from './items/item-lote.module.js';

@Module({
  imports: [ItemLoteModule],
  controllers: [LotesController],
  providers: [LotesService],
  exports: [LotesService],
})
export class LotesModule {}
