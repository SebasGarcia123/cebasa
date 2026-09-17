import { Module } from '@nestjs/common';
import { LoteProdService } from './lote-prod.service.js';
import { LoteProdController } from './lote-prod.controller.js';
import { ItemProdModule } from './items/item-prod.module.js';

@Module({
  imports: [ItemProdModule],
  controllers: [LoteProdController],
  providers: [LoteProdService],
  exports: [LoteProdService],
})
export class LoteProdModule {}
