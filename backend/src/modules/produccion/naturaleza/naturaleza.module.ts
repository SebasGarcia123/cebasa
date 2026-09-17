import { Module } from '@nestjs/common';
import { NaturalezaService } from './naturaleza.service.js';
import { NaturalezaController } from './naturaleza.controller.js';

@Module({
  controllers: [NaturalezaController],
  providers: [NaturalezaService],
  exports: [NaturalezaService],
})
export class NaturalezaModule {}
