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
import { RecetaService } from './receta.service.js';
import { CreateRecetaDto } from './dto/create-receta.dto.js';
import { UpdateRecetaDto } from './dto/update-receta.dto.js';
import { ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../../auth/decorators/permissions.decorator.js';

@ApiTags('Receta')
@Controller('recetas')
export class RecetaController {
  constructor(private readonly recetaService: RecetaService) {}

  @RequirePermissions('produccion.editar')
  @Post()
  create(@Body() dto: CreateRecetaDto) {
    return this.recetaService.create(dto);
  }

  @RequirePermissions('produccion.ver')
  @Get()
  findAll() {
    return this.recetaService.findAll();
  }

  @RequirePermissions('produccion.ver')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.recetaService.findOne(id);
  }

  @RequirePermissions('produccion.editar')
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRecetaDto) {
    return this.recetaService.update(id, dto);
  }

  @RequirePermissions('produccion.editar')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.recetaService.remove(id);
  }
}
