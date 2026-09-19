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
import { MovimientoInsumoService } from './movimiento-insumo.service.js';
import { CreateMovimientoInsumoDto } from './dto/create-movimiento-insumo.dto.js';
import { UpdateMovimientoInsumoDto } from './dto/update-movimiento-insumo.dto.js';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Movimiento Insumo')
@Controller('movimientos-insumo')
export class MovimientoInsumoController {
  constructor(
    private readonly movimientoInsumoService: MovimientoInsumoService,
  ) {}

  @Post()
  create(@Body() dto: CreateMovimientoInsumoDto) {
    return this.movimientoInsumoService.create(dto);
  }

  @Get()
  findAll() {
    return this.movimientoInsumoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.movimientoInsumoService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMovimientoInsumoDto,
  ) {
    return this.movimientoInsumoService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.movimientoInsumoService.remove(id);
  }
}
