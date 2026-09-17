import { Module } from '@nestjs/common';
import { CamionService } from './camion.service.js';
import { CamionController } from './camion.controller.js';

@Module({
  controllers: [CamionController],
  providers: [CamionService],
})
export class CamionModule {}
