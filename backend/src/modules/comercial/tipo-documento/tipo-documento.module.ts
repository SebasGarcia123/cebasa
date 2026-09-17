import { Module } from '@nestjs/common';
import { TipoDocumentoService } from './tipo-documento.service.js';
import { TipoDocumentoController } from './tipo-documento.controller.js';

@Module({
  controllers: [TipoDocumentoController],
  providers: [TipoDocumentoService],
  exports: [TipoDocumentoService],
})
export class TipoDocumentoModule {}
