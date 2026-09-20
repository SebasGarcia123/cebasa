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
import { RecetaItemService } from './receta-item.service.js';
import { CreateRecetaItemDto } from './dto/create-receta-item.dto.js';
import { UpdateRecetaItemDto } from './dto/update-receta-item.dto.js';
import { ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../../../auth/decorators/permissions.decorator.js';

@ApiTags('Receta - Items')
@Controller('recetas/:idReceta/items')
export class RecetaItemController {
  constructor(private readonly recetaItemService: RecetaItemService) {}

  @RequirePermissions('produccion.ver')
  @Get()
  findAll(@Param('idReceta', ParseIntPipe) idReceta: number) {
    return this.recetaItemService.findAllForReceta(idReceta);
  }

  @RequirePermissions('produccion.editar')
  @Post()
  create(
    @Param('idReceta', ParseIntPipe) idReceta: number,
    @Body() dto: CreateRecetaItemDto,
  ) {
    return this.recetaItemService.create(idReceta, dto);
  }

  @RequirePermissions('produccion.ver')
  @Get(':idItem')
  findOne(
    @Param('idReceta', ParseIntPipe) idReceta: number,
    @Param('idItem', ParseIntPipe) idItem: number,
  ) {
    return this.recetaItemService.findOne(idReceta, idItem);
  }

  @RequirePermissions('produccion.editar')
  @Patch(':idItem')
  update(
    @Param('idReceta', ParseIntPipe) idReceta: number,
    @Param('idItem', ParseIntPipe) idItem: number,
    @Body() dto: UpdateRecetaItemDto,
  ) {
    return this.recetaItemService.update(idReceta, idItem, dto);
  }

  @RequirePermissions('produccion.editar')
  @Delete(':idItem')
  remove(
    @Param('idReceta', ParseIntPipe) idReceta: number,
    @Param('idItem', ParseIntPipe) idItem: number,
  ) {
    return this.recetaItemService.remove(idReceta, idItem);
  }
}
