import { Module } from '@nestjs/common';
import { DocumentosService } from './documentos.service.js';
import { DocumentosController } from './documentos.controller.js';
import { DocumentoPdfService } from './documento-pdf.service.js';

@Module({
  controllers: [DocumentosController],
  providers: [DocumentosService, DocumentoPdfService],
})
export class DocumentosModule {}
