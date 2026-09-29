import { Module } from '@nestjs/common';
import { TipoBobinaService } from './tipo-bobina.service.js';
import { TipoBobinaController } from './tipo-bobina.controller.js';

@Module({
  controllers: [TipoBobinaController],
  providers: [TipoBobinaService],
})
export class TipoBobinaModule {}
