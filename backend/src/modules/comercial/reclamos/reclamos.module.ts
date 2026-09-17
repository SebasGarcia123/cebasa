import { Module } from '@nestjs/common';
import { ReclamosService } from './reclamos.service.js';
import { ReclamosController } from './reclamos.controller.js';

@Module({
  controllers: [ReclamosController],
  providers: [ReclamosService],
  exports: [ReclamosService],
})
export class ReclamosModule {}
