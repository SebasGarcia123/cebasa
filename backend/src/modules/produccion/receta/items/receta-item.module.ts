import { Module } from '@nestjs/common';
import { RecetaItemService } from './receta-item.service.js';
import { RecetaItemController } from './receta-item.controller.js';

@Module({
  controllers: [RecetaItemController],
  providers: [RecetaItemService],
})
export class RecetaItemModule {}
