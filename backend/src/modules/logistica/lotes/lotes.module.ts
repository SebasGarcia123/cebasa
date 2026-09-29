import { Module } from '@nestjs/common';
import { LotesService } from './lotes.service.js';
import { LotesController } from './lotes.controller.js';
import { LoteInterplantaPdfService } from './lote-interplanta-pdf.service.js';
import { ItemLoteModule } from './items/item-lote.module.js';

@Module({
  imports: [ItemLoteModule],
  controllers: [LotesController],
  providers: [LotesService, LoteInterplantaPdfService],
  exports: [LotesService],
})
export class LotesModule {}
