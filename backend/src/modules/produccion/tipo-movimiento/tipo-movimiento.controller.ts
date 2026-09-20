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

  @RequirePermissions('produccion.editar')
  @Post()
  create(@Body() dto: CreateTipoMovimientoDto) {
    return this.tipoMovimientoService.create(dto);
  }

  @RequirePermissions('produccion.ver')
  @Get()
  findAll() {
    return this.tipoMovimientoService.findAll();
  }

  @RequirePermissions('produccion.ver')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tipoMovimientoService.findOne(id);
  }

  @RequirePermissions('produccion.editar')
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTipoMovimientoDto,
  ) {
    return this.tipoMovimientoService.update(id, dto);
  }

  @RequirePermissions('produccion.editar')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.tipoMovimientoService.remove(id);
  }
}
