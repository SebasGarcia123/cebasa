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
import { ItemLoteService } from './item-lote.service.js';
import { CreateItemLoteDto } from './dto/create-item-lote.dto.js';
import { UpdateItemLoteDto } from './dto/update-item-lote.dto.js';
import { ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../../../auth/decorators/permissions.decorator.js';

@ApiTags('Lotes - Items')
@Controller('lotes/:idLote/items')
export class ItemLoteController {
  constructor(private readonly itemLoteService: ItemLoteService) {}

  @RequirePermissions('logistica.ver')
  @Get()
  findAll(@Param('idLote', ParseIntPipe) idLote: number) {
    return this.itemLoteService.findAllForLote(idLote);
  }

  @RequirePermissions('logistica.editar')
  @Post()
  create(
    @Param('idLote', ParseIntPipe) idLote: number,
    @Body() dto: CreateItemLoteDto,
  ) {
    return this.itemLoteService.create(idLote, dto);
  }

  @RequirePermissions('logistica.ver')
  @Get(':idItem')
  findOne(
    @Param('idLote', ParseIntPipe) idLote: number,
    @Param('idItem', ParseIntPipe) idItem: number,
  ) {
    return this.itemLoteService.findOne(idLote, idItem);
  }

  @RequirePermissions('logistica.editar')
  @Patch(':idItem')
  update(
    @Param('idLote', ParseIntPipe) idLote: number,
    @Param('idItem', ParseIntPipe) idItem: number,
    @Body() dto: UpdateItemLoteDto,
  ) {
    return this.itemLoteService.update(idLote, idItem, dto);
  }

  @RequirePermissions('logistica.editar')
  @Delete(':idItem')
  remove(
    @Param('idLote', ParseIntPipe) idLote: number,
    @Param('idItem', ParseIntPipe) idItem: number,
  ) {
    return this.itemLoteService.remove(idLote, idItem);
  }
}
