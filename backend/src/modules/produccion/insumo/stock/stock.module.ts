import { Module } from '@nestjs/common';
import { StockInsumoDepositoService } from './stock.service.js';
import { StockInsumoDepositoController } from './stock.controller.js';

@Module({
  controllers: [StockInsumoDepositoController],
  providers: [StockInsumoDepositoService],
})
export class StockInsumoDepositoModule {}
