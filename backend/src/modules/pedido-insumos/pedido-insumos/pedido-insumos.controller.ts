import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { PedidoInsumosService } from './pedido-insumos.service.js';
import { CreatePedidoInsumosDto } from './dto/create-pedido-insumos.dto.js';
import { UpdatePedidoInsumosDto } from './dto/update-pedido-insumos.dto.js';

@Controller('pedidos-insumos')
export class PedidoInsumosController {
  constructor(private readonly pedidoInsumosService: PedidoInsumosService) {}

  @Post()
  create(@Body() dto: CreatePedidoInsumosDto) {
    return this.pedidoInsumosService.create(dto);
  }

  @Get()
  findAll() {
    return this.pedidoInsumosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.pedidoInsumosService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePedidoInsumosDto) {
    return this.pedidoInsumosService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.pedidoInsumosService.remove(id);
  }
}
