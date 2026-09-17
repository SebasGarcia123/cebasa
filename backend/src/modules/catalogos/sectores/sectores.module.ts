import { Module } from '@nestjs/common';
import { SectoresService } from './sectores.service.js';
import { SectoresController } from './sectores.controller.js';

@Module({
  controllers: [SectoresController],
  providers: [SectoresService],
  exports: [SectoresService],
})
export class SectoresModule {}
