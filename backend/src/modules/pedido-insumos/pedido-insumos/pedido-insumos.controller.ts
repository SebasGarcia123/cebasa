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
import { PedidoInsumosService } from './pedido-insumos.service.js';
import { CreatePedidoInsumosDto } from './dto/create-pedido-insumos.dto.js';
import { UpdatePedidoInsumosDto } from './dto/update-pedido-insumos.dto.js';
import { ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../../auth/decorators/permissions.decorator.js';

@ApiTags('Pedido Insumos')
@Controller('pedidos-insumos')
export class PedidoInsumosController {
  constructor(private readonly pedidoInsumosService: PedidoInsumosService) {}

  @RequirePermissions('pedido_insumos.editar')
  @Post()
  create(@Body() dto: CreatePedidoInsumosDto) {
    return this.pedidoInsumosService.create(dto);
  }

  @RequirePermissions('pedido_insumos.ver')
  @Get()
  findAll() {
    return this.pedidoInsumosService.findAll();
  }

  @RequirePermissions('pedido_insumos.ver')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.pedidoInsumosService.findOne(id);
  }

  @RequirePermissions('pedido_insumos.editar')
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePedidoInsumosDto,
  ) {
    return this.pedidoInsumosService.update(id, dto);
  }

  @RequirePermissions('pedido_insumos.editar')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.pedidoInsumosService.remove(id);
  }
}
