import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PedidoInsumosService } from './pedido-insumos.service.js';
import { CreatePedidoInsumosDto } from './dto/create-pedido-insumos.dto.js';
import { UpdatePedidoInsumosDto } from './dto/update-pedido-insumos.dto.js';
import { CumplirPedidoInsumosDto } from './dto/cumplir-pedido-insumos.dto.js';
import { ParaRevisarPedidoInsumosDto } from './dto/para-revisar-pedido-insumos.dto.js';
import { RecibirPedidoInsumosDto } from './dto/recibir-pedido-insumos.dto.js';
import { RequirePermissions } from '../../../auth/decorators/permissions.decorator.js';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator.js';
import type { JwtPayload } from '../../../auth/types/jwt-payload.interface.js';

@ApiTags('Pedido Insumos')
@Controller('pedidos-insumos')
export class PedidoInsumosController {
  constructor(private readonly pedidoInsumosService: PedidoInsumosService) {}

  // Lo carga la Jefatura de Producción.
  @RequirePermissions('pedido_insumos.solicitar')
  @Post()
  create(@Body() dto: CreatePedidoInsumosDto, @CurrentUser() user: JwtPayload) {
    return this.pedidoInsumosService.create(dto, user.sub);
  }

  // Pantalla de Producción: todos sus pedidos, con filtro de fecha y
  // "ver todos" (si no, oculta Recibidos/Anulados).
  @RequirePermissions('pedido_insumos.ver')
  @Get()
  findParaProduccion(
    @CurrentUser() user: JwtPayload,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('verTodos') verTodos?: string,
  ) {
    return this.pedidoInsumosService.findParaProduccion(user, { desde, hasta, verTodos: verTodos === 'true' });
  }

  // Pantalla de Logística: solo lo que necesita su acción.
  @RequirePermissions('pedido_insumos.ver')
  @Get('para-logistica')
  findParaLogistica(@CurrentUser() user: JwtPayload) {
    return this.pedidoInsumosService.findParaLogistica(user);
  }

  @RequirePermissions('pedido_insumos.ver')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.pedidoInsumosService.findOne(id);
  }

  @RequirePermissions('pedido_insumos.solicitar')
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePedidoInsumosDto) {
    return this.pedidoInsumosService.update(id, dto);
  }

  @RequirePermissions('pedido_insumos.solicitar')
  @Post(':id/anular')
  anular(@Param('id', ParseIntPipe) id: number) {
    return this.pedidoInsumosService.anular(id);
  }

  // Logística (operario o jefe) carga lo que realmente abasteció.
  @RequirePermissions('pedido_insumos.cumplir')
  @Post(':id/cumplir')
  cumplir(@Param('id', ParseIntPipe) id: number, @Body() dto: CumplirPedidoInsumosDto, @CurrentUser() user: JwtPayload) {
    return this.pedidoInsumosService.cumplir(id, dto, user);
  }

  // Producción confirma: mueve el stock de Logística a Producción.
  @RequirePermissions('pedido_insumos.recibir')
  @Post(':id/recibir')
  recibir(@Param('id', ParseIntPipe) id: number, @Body() dto: RecibirPedidoInsumosDto) {
    return this.pedidoInsumosService.recibir(id, dto);
  }

  // Producción lo devuelve a Logística con un motivo.
  @RequirePermissions('pedido_insumos.recibir')
  @Post(':id/para-revisar')
  paraRevisar(@Param('id', ParseIntPipe) id: number, @Body() dto: ParaRevisarPedidoInsumosDto) {
    return this.pedidoInsumosService.paraRevisar(id, dto);
  }
}
