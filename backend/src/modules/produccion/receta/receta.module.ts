import { Module } from '@nestjs/common';
import { RecetaService } from './receta.service.js';
import { RecetaController } from './receta.controller.js';
import { RecetaItemModule } from './items/receta-item.module.js';

@Module({
  imports: [RecetaItemModule],
  controllers: [RecetaController],
  providers: [RecetaService],
  exports: [RecetaService],
})
export class RecetaModule {}
