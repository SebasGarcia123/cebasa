import { Body, Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CargaPedidosService } from './carga-pedidos.service.js';
import { IniciarCargaDto } from './dto/iniciar-carga.dto.js';
import { RequirePermissions } from '../../../auth/decorators/permissions.decorator.js';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator.js';
import type { JwtPayload } from '../../../auth/types/jwt-payload.interface.js';

@ApiTags('Carga de Pedidos')
@Controller('carga-pedidos')
export class CargaPedidosController {
  constructor(private readonly cargaPedidosService: CargaPedidosService) {}

  // Pedidos a cargar en un día (YYYY-MM-DD).
  @RequirePermissions('logistica.carga_pedidos.ver')
  @Get()
  findPedidosDelDia(@Query('fecha') fecha: string) {
    return this.cargaPedidosService.findPedidosDelDia(fecha);
  }

  @RequirePermissions('logistica.carga_pedidos.ver')
  @Get(':idPedido/pallets')
  listarPallets(@Param('idPedido', ParseIntPipe) idPedido: number) {
    return this.cargaPedidosService.listarPallets(idPedido);
  }

  @RequirePermissions('logistica.carga_pedidos.cargar')
  @Post(':idPedido/iniciar')
  iniciar(@Param('idPedido', ParseIntPipe) idPedido: number, @Body() dto: IniciarCargaDto) {
    return this.cargaPedidosService.iniciar(idPedido, dto);
  }

  @RequirePermissions('logistica.carga_pedidos.cargar')
  @Post('pallets/:idCargaPallet/cargar')
  cargarPallet(@Param('idCargaPallet', ParseIntPipe) idCargaPallet: number, @CurrentUser() user: JwtPayload) {
    return this.cargaPedidosService.cargarPallet(idCargaPallet, user.sub);
  }
}
