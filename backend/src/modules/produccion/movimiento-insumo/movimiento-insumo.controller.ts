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
import { RequirePermissions } from '../../../auth/decorators/permissions.decorator.js';

@ApiTags('Movimiento Insumo')
@Controller('movimientos-insumo')
export class MovimientoInsumoController {
  constructor(
    private readonly movimientoInsumoService: MovimientoInsumoService,
  ) {}

  @RequirePermissions('produccion.movimientos_insumo.editar')
  @Post()
  create(@Body() dto: CreateMovimientoInsumoDto) {
    return this.movimientoInsumoService.create(dto);
  }

  @RequirePermissions('produccion.movimientos_insumo.editar')
  @Get()
  findAll() {
    return this.movimientoInsumoService.findAll();
  }

  @RequirePermissions('produccion.movimientos_insumo.editar')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.movimientoInsumoService.findOne(id);
  }

  @RequirePermissions('produccion.movimientos_insumo.editar')
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMovimientoInsumoDto,
  ) {
    return this.movimientoInsumoService.update(id, dto);
  }

  @RequirePermissions('produccion.movimientos_insumo.editar')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.movimientoInsumoService.remove(id);
  }
}
