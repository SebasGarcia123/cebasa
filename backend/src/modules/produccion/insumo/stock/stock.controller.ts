import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { StockInsumoDepositoService } from './stock.service.js';
import { CreateStockInsumoDepositoDto } from './dto/create-stock.dto.js';
import { UpdateStockInsumoDepositoDto } from './dto/update-stock.dto.js';
import { ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../../../auth/decorators/permissions.decorator.js';

@ApiTags('Insumo - Stock')
@Controller('insumos/:idInsumo/stock')
export class StockInsumoDepositoController {
  constructor(private readonly stockService: StockInsumoDepositoService) {}

  @RequirePermissions('produccion.ver')
  @Get()
  findAll(@Param('idInsumo', ParseIntPipe) idInsumo: number) {
    return this.stockService.findAllForInsumo(idInsumo);
  }

  @RequirePermissions('produccion.editar')
  @Post()
  create(
    @Param('idInsumo', ParseIntPipe) idInsumo: number,
    @Body() dto: CreateStockInsumoDepositoDto,
  ) {
    return this.stockService.create(idInsumo, dto);
  }

  @RequirePermissions('produccion.ver')
  @Get(':idDeposito')
  findOne(
    @Param('idInsumo', ParseIntPipe) idInsumo: number,
    @Param('idDeposito', ParseIntPipe) idDeposito: number,
  ) {
    return this.stockService.findOne(idInsumo, idDeposito);
  }

  @RequirePermissions('produccion.editar')
  @Patch(':idDeposito')
  update(
    @Param('idInsumo', ParseIntPipe) idInsumo: number,
    @Param('idDeposito', ParseIntPipe) idDeposito: number,
    @Body() dto: UpdateStockInsumoDepositoDto,
  ) {
    return this.stockService.update(idInsumo, idDeposito, dto);
  }

  @RequirePermissions('produccion.editar')
  @Delete(':idDeposito')
  remove(
    @Param('idInsumo', ParseIntPipe) idInsumo: number,
    @Param('idDeposito', ParseIntPipe) idDeposito: number,
  ) {
    return this.stockService.remove(idInsumo, idDeposito);
  }
}
