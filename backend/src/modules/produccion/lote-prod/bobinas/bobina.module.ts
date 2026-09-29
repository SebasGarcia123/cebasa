import { Module } from '@nestjs/common';
import { BobinaService } from './bobina.service.js';
import { BobinaController } from './bobina.controller.js';
import { RotuloPdfService } from '../../../../pdf/rotulo-pdf.service.js';

@Module({
  controllers: [BobinaController],
  providers: [BobinaService, RotuloPdfService],
})
export class BobinaModule {}
