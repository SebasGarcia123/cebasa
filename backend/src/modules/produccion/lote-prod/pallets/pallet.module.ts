import { Module } from '@nestjs/common';
import { PalletService } from './pallet.service.js';
import { PalletController } from './pallet.controller.js';
import { RotuloPdfService } from '../../../../pdf/rotulo-pdf.service.js';

@Module({
  controllers: [PalletController],
  providers: [PalletService, RotuloPdfService],
})
export class PalletModule {}
