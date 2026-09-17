import { Module } from '@nestjs/common';
import { TransporteService } from './transporte.service.js';
import { TransporteController } from './transporte.controller.js';
import { CamionModule } from './camion/camion.module.js';
import { ChoferModule } from './chofer/chofer.module.js';

@Module({
  imports: [CamionModule, ChoferModule],
  controllers: [TransporteController],
  providers: [TransporteService],
  exports: [TransporteService],
})
export class TransporteModule {}
