import { Module } from '@nestjs/common';
import { TipoImpactoService } from './tipo-impacto.service.js';
import { TipoImpactoController } from './tipo-impacto.controller.js';

@Module({
  controllers: [TipoImpactoController],
  providers: [TipoImpactoService],
  exports: [TipoImpactoService],
})
export class TipoImpactoModule {}
