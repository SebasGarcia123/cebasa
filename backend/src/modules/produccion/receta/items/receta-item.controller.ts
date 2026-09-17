import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { RecetaItemService } from './receta-item.service.js';
import { CreateRecetaItemDto } from './dto/create-receta-item.dto.js';
import { UpdateRecetaItemDto } from './dto/update-receta-item.dto.js';

@Controller('recetas/:idReceta/items')
export class RecetaItemController {
  constructor(private readonly recetaItemService: RecetaItemService) {}

  @Get()
  findAll(@Param('idReceta', ParseIntPipe) idReceta: number) {
    return this.recetaItemService.findAllForReceta(idReceta);
  }

  @Post()
  create(@Param('idReceta', ParseIntPipe) idReceta: number, @Body() dto: CreateRecetaItemDto) {
    return this.recetaItemService.create(idReceta, dto);
  }

  @Get(':idItem')
  findOne(
    @Param('idReceta', ParseIntPipe) idReceta: number,
    @Param('idItem', ParseIntPipe) idItem: number,
  ) {
    return this.recetaItemService.findOne(idReceta, idItem);
  }

  @Patch(':idItem')
  update(
    @Param('idReceta', ParseIntPipe) idReceta: number,
    @Param('idItem', ParseIntPipe) idItem: number,
    @Body() dto: UpdateRecetaItemDto,
  ) {
    return this.recetaItemService.update(idReceta, idItem, dto);
  }

  @Delete(':idItem')
  remove(
    @Param('idReceta', ParseIntPipe) idReceta: number,
    @Param('idItem', ParseIntPipe) idItem: number,
  ) {
    return this.recetaItemService.remove(idReceta, idItem);
  }
}
