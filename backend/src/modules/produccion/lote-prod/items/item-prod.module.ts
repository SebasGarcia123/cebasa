import { Module } from '@nestjs/common';
import { ItemProdService } from './item-prod.service.js';
import { ItemProdController } from './item-prod.controller.js';

@Module({
  controllers: [ItemProdController],
  providers: [ItemProdService],
})
export class ItemProdModule {}
