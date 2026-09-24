import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { PedidosService } from './pedidos.service.js';
import { CreatePedidoDto } from './dto/create-pedido.dto.js';
import { UpdatePedidoDto } from './dto/update-pedido.dto.js';
import { AnularPedidoDto } from './dto/anular-pedido.dto.js';
import { DespacharPedidoDto } from './dto/despachar-pedido.dto.js';
import { ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../../auth/decorators/permissions.decorator.js';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator.js';
import type { JwtPayload } from '../../../auth/types/jwt-payload.interface.js';

@ApiTags('Pedidos')
@Controller('pedidos')
export class PedidosController {
  constructor(private readonly pedidosService: PedidosService) {}

  @RequirePermissions('comercial.editar')
  @Post()
  create(@Body() dto: CreatePedidoDto) {
    return this.pedidosService.create(dto);
  }

  @RequirePermissions('comercial.ver')
  @Get()
  findAll() {
    return this.pedidosService.findAll();
  }

  @RequirePermissions('comercial.ver')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.pedidosService.findOne(id);
  }

  @RequirePermissions('comercial.editar')
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePedidoDto) {
    return this.pedidosService.update(id, dto);
  }

  @RequirePermissions('comercial.editar')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.pedidosService.remove(id);
  }

  // Facturar/despachar/anular-desde-facturado son responsabilidad de
  // Logística, no de quien carga el pedido: permiso propio en vez de
  // comercial.editar (mismo criterio que produccion.lotes_aprobar).
  @RequirePermissions('comercial.pedidos_facturar')
  @Post(':id/facturar')
  facturar(@Param('id', ParseIntPipe) id: number) {
    return this.pedidosService.facturar(id);
  }

  @RequirePermissions('comercial.pedidos_despachar')
  @Post(':id/despachar')
  async despachar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: DespacharPedidoDto,
    @CurrentUser() user: JwtPayload,
    @Res() res: Response,
  ) {
    const pdf = await this.pedidosService.despachar(id, dto, user.sub);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="remito-pedido-${id}.pdf"`,
    });
    res.send(pdf);
  }

  @RequirePermissions('comercial.ver')
  @Get(':id/remito')
  async remito(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const { buffer, nombreArchivo } = await this.pedidosService.obtenerRemito(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${nombreArchivo}"`,
    });
    res.send(buffer);
  }

  // Anular con motivo (pedido Cargado) o nro de nota de débito (pedido
  // Facturado): el permiso requerido depende de en cuál de los dos
  // casos esté, así que se exige el más restrictivo de los dos
  // (comercial.pedidos_facturar) y PedidosService.anular valida el resto.
  @RequirePermissions('comercial.pedidos_facturar')
  @Post(':id/anular')
  anular(@Param('id', ParseIntPipe) id: number, @Body() dto: AnularPedidoDto) {
    return this.pedidosService.anular(id, dto);
  }
}
