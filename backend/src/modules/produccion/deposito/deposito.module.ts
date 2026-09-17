import { Module } from '@nestjs/common';
import { DepositoService } from './deposito.service.js';
import { DepositoController } from './deposito.controller.js';

@Module({
  controllers: [DepositoController],
  providers: [DepositoService],
  exports: [DepositoService],
})
export class DepositoModule {}
