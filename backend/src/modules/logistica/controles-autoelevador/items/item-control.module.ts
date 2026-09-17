import { Module } from '@nestjs/common';
import { ItemControlService } from './item-control.service.js';
import { ItemControlController } from './item-control.controller.js';

@Module({
  controllers: [ItemControlController],
  providers: [ItemControlService],
})
export class ItemControlModule {}
