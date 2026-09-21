import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { StockService } from './stock.service.js';
import { AjustarStockDto } from './dto/ajustar-stock.dto.js';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator.js';
import { CurrentUser } from '../../auth/decorators/current-user.decorator.js';
import type { JwtPayload } from '../../auth/types/jwt-payload.interface.js';

// Sin @RequirePermissions en los GET: el stock es de consulta libre para
// cualquier usuario autenticado (transparente para toda la organización).
// Solo el ajuste (POST) exige stock.ajustar, pensado para que Logística
// lo tenga sin necesitar producción.editar ni comercial.editar completos.
@ApiTags('Stock')
@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get('insumos')
  findInsumos() {
    return this.stockService.findInsumos();
  }

  @Get('productos')
  findProductos() {
    return this.stockService.findProductos();
  }

  @RequirePermissions('stock.ajustar')
  @Post('insumos/:id/ajuste')
  ajustarInsumo(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AjustarStockDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.stockService.ajustarInsumo(id, dto, user.sub);
  }

  @RequirePermissions('stock.ajustar')
  @Post('productos/:id/ajuste')
  ajustarProducto(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AjustarStockDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.stockService.ajustarProducto(id, dto, user.sub);
  }
}
