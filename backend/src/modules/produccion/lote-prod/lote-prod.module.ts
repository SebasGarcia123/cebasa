import { Module } from '@nestjs/common';
import { LoteProdService } from './lote-prod.service.js';
import { LoteProdController } from './lote-prod.controller.js';
import { ItemProdModule } from './items/item-prod.module.js';
import { BobinaModule } from './bobinas/bobina.module.js';
import { PalletModule } from './pallets/pallet.module.js';

@Module({
  imports: [ItemProdModule, BobinaModule, PalletModule],
  controllers: [LoteProdController],
  providers: [LoteProdService],
  exports: [LoteProdService],
})
export class LoteProdModule {}
