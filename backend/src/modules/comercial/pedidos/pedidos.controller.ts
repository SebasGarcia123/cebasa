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
import { PedidosService } from './pedidos.service.js';
import { CreatePedidoDto } from './dto/create-pedido.dto.js';
import { UpdatePedidoDto } from './dto/update-pedido.dto.js';
import { ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../../auth/decorators/permissions.decorator.js';

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
}
