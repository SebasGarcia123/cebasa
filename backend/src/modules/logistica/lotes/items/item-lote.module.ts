import { Module } from '@nestjs/common';
import { ItemLoteService } from './item-lote.service.js';
import { ItemLoteController } from './item-lote.controller.js';

@Module({
  controllers: [ItemLoteController],
  providers: [ItemLoteService],
})
export class ItemLoteModule {}
