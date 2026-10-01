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
import { MovimientoProductoService } from './movimiento-producto.service.js';
import { CreateMovimientoProductoDto } from './dto/create-movimiento-producto.dto.js';
import { UpdateMovimientoProductoDto } from './dto/update-movimiento-producto.dto.js';
import { ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../../auth/decorators/permissions.decorator.js';

@ApiTags('Movimiento Producto')
@Controller('movimientos-producto')
export class MovimientoProductoController {
  constructor(
    private readonly movimientoProductoService: MovimientoProductoService,
  ) {}

  @RequirePermissions('produccion.movimientos_producto.editar')
  @Post()
  create(@Body() dto: CreateMovimientoProductoDto) {
    return this.movimientoProductoService.create(dto);
  }

  @RequirePermissions('produccion.movimientos_producto.editar')
  @Get()
  findAll() {
    return this.movimientoProductoService.findAll();
  }

  @RequirePermissions('produccion.movimientos_producto.editar')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.movimientoProductoService.findOne(id);
  }

  @RequirePermissions('produccion.movimientos_producto.editar')
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMovimientoProductoDto,
  ) {
    return this.movimientoProductoService.update(id, dto);
  }

  @RequirePermissions('produccion.movimientos_producto.editar')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.movimientoProductoService.remove(id);
  }
}
