import { Module } from '@nestjs/common';
import { ChoferService } from './chofer.service.js';
import { ChoferController } from './chofer.controller.js';

@Module({
  controllers: [ChoferController],
  providers: [ChoferService],
})
export class ChoferModule {}
