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
import { InsumoService } from './insumo.service.js';
import { CreateInsumoDto } from './dto/create-insumo.dto.js';
import { UpdateInsumoDto } from './dto/update-insumo.dto.js';
import { ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../../auth/decorators/permissions.decorator.js';

@ApiTags('Insumo')
@Controller('insumos')
export class InsumoController {
  constructor(private readonly insumoService: InsumoService) {}

  @RequirePermissions('produccion.insumos.editar')
  @Post()
  create(@Body() dto: CreateInsumoDto) {
    return this.insumoService.create(dto);
  }

  @Get()
  findAll() {
    return this.insumoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.insumoService.findOne(id);
  }

  @RequirePermissions('produccion.insumos.editar')
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateInsumoDto) {
    return this.insumoService.update(id, dto);
  }

  @RequirePermissions('produccion.insumos.editar')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.insumoService.remove(id);
  }
}
