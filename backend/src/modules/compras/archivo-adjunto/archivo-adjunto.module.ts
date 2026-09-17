import { Module } from '@nestjs/common';
import { ArchivoAdjuntoService } from './archivo-adjunto.service.js';
import { ArchivoAdjuntoController } from './archivo-adjunto.controller.js';

@Module({
  controllers: [ArchivoAdjuntoController],
  providers: [ArchivoAdjuntoService],
  exports: [ArchivoAdjuntoService],
})
export class ArchivoAdjuntoModule {}
