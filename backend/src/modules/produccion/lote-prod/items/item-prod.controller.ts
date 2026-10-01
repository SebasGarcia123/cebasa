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
import { ItemProdService } from './item-prod.service.js';
import { CreateItemProdDto } from './dto/create-item-prod.dto.js';
import { UpdateItemProdDto } from './dto/update-item-prod.dto.js';
import { ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../../../auth/decorators/permissions.decorator.js';

@ApiTags('Lote Prod - Items')
@Controller('lotes-prod/:idLote/items')
export class ItemProdController {
  constructor(private readonly itemProdService: ItemProdService) {}

  @RequirePermissions('produccion.lotes_prod.ver')
  @Get()
  findAll(@Param('idLote', ParseIntPipe) idLote: number) {
    return this.itemProdService.findAllForLote(idLote);
  }

  @RequirePermissions('produccion.operario_prod.cargar')
  @Post()
  create(
    @Param('idLote', ParseIntPipe) idLote: number,
    @Body() dto: CreateItemProdDto,
  ) {
    return this.itemProdService.create(idLote, dto);
  }

  @RequirePermissions('produccion.lotes_prod.ver')
  @Get(':idItem')
  findOne(
    @Param('idLote', ParseIntPipe) idLote: number,
    @Param('idItem', ParseIntPipe) idItem: number,
  ) {
    return this.itemProdService.findOne(idLote, idItem);
  }

  @RequirePermissions('produccion.operario_prod.cargar')
  @Patch(':idItem')
  update(
    @Param('idLote', ParseIntPipe) idLote: number,
    @Param('idItem', ParseIntPipe) idItem: number,
    @Body() dto: UpdateItemProdDto,
  ) {
    return this.itemProdService.update(idLote, idItem, dto);
  }

  @RequirePermissions('produccion.operario_prod.cargar')
  @Delete(':idItem')
  remove(
    @Param('idLote', ParseIntPipe) idLote: number,
    @Param('idItem', ParseIntPipe) idItem: number,
  ) {
    return this.itemProdService.remove(idLote, idItem);
  }
}
