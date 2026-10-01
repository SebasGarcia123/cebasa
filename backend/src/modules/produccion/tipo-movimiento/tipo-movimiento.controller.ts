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
import { TipoMovimientoService } from './tipo-movimiento.service.js';
import { CreateTipoMovimientoDto } from './dto/create-tipo-movimiento.dto.js';
import { UpdateTipoMovimientoDto } from './dto/update-tipo-movimiento.dto.js';
import { ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../../auth/decorators/permissions.decorator.js';

@ApiTags('Tipo Movimiento')
@Controller('tipo-movimiento')
export class TipoMovimientoController {
  constructor(private readonly tipoMovimientoService: TipoMovimientoService) {}

  @RequirePermissions('produccion.tipo_movimiento.editar')
  @Post()
  create(@Body() dto: CreateTipoMovimientoDto) {
    return this.tipoMovimientoService.create(dto);
  }

  @Get()
  findAll() {
    return this.tipoMovimientoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tipoMovimientoService.findOne(id);
  }

  @RequirePermissions('produccion.tipo_movimiento.editar')
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTipoMovimientoDto,
  ) {
    return this.tipoMovimientoService.update(id, dto);
  }

  @RequirePermissions('produccion.tipo_movimiento.editar')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.tipoMovimientoService.remove(id);
  }
}
