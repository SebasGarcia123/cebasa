import { Module } from '@nestjs/common';
import { FleteroService } from './fletero.service.js';
import { FleteroController } from './fletero.controller.js';

@Module({
  controllers: [FleteroController],
  providers: [FleteroService],
  exports: [FleteroService],
})
export class FleteroModule {}
