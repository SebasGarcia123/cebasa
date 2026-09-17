import { Module } from '@nestjs/common';
import { LineasService } from './lineas.service.js';
import { LineasController } from './lineas.controller.js';

@Module({
  controllers: [LineasController],
  providers: [LineasService],
  exports: [LineasService],
})
export class LineasModule {}
