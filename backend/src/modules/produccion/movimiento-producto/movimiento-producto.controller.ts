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

@ApiTags('Movimiento Producto')
@Controller('movimientos-producto')
export class MovimientoProductoController {
  constructor(
    private readonly movimientoProductoService: MovimientoProductoService,
  ) {}

  @Post()
  create(@Body() dto: CreateMovimientoProductoDto) {
    return this.movimientoProductoService.create(dto);
  }

  @Get()
  findAll() {
    return this.movimientoProductoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.movimientoProductoService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMovimientoProductoDto,
  ) {
    return this.movimientoProductoService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.movimientoProductoService.remove(id);
  }
}
