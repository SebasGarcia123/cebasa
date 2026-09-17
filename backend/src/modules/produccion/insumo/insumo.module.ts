import { Module } from '@nestjs/common';
import { InsumoService } from './insumo.service.js';
import { InsumoController } from './insumo.controller.js';
import { StockInsumoDepositoModule } from './stock/stock.module.js';

@Module({
  imports: [StockInsumoDepositoModule],
  controllers: [InsumoController],
  providers: [InsumoService],
  exports: [InsumoService],
})
export class InsumoModule {}
