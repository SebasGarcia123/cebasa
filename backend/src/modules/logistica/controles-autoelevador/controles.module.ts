import { Module } from '@nestjs/common';
import { ControlesAutoelevadorService } from './controles.service.js';
import { ControlesAutoelevadorController } from './controles.controller.js';
import { ItemControlModule } from './items/item-control.module.js';

@Module({
  imports: [ItemControlModule],
  controllers: [ControlesAutoelevadorController],
  providers: [ControlesAutoelevadorService],
  exports: [ControlesAutoelevadorService],
})
export class ControlesAutoelevadorModule {}
