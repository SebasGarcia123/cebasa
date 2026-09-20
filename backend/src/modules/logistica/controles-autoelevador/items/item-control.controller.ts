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
import { ItemControlService } from './item-control.service.js';
import { CreateItemControlDto } from './dto/create-item-control.dto.js';
import { UpdateItemControlDto } from './dto/update-item-control.dto.js';
import { ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../../../auth/decorators/permissions.decorator.js';

@ApiTags('Controles Autoelevador - Items')
@Controller('controles-autoelevador/:idControl/items')
export class ItemControlController {
  constructor(private readonly itemControlService: ItemControlService) {}

  @RequirePermissions('logistica.ver')
  @Get()
  findAll(@Param('idControl', ParseIntPipe) idControl: number) {
    return this.itemControlService.findAllForControl(idControl);
  }

  @RequirePermissions('logistica.editar')
  @Post()
  create(
    @Param('idControl', ParseIntPipe) idControl: number,
    @Body() dto: CreateItemControlDto,
  ) {
    return this.itemControlService.create(idControl, dto);
  }

  @RequirePermissions('logistica.ver')
  @Get(':idItem')
  findOne(
    @Param('idControl', ParseIntPipe) idControl: number,
    @Param('idItem', ParseIntPipe) idItem: number,
  ) {
    return this.itemControlService.findOne(idControl, idItem);
  }

  @RequirePermissions('logistica.editar')
  @Patch(':idItem')
  update(
    @Param('idControl', ParseIntPipe) idControl: number,
    @Param('idItem', ParseIntPipe) idItem: number,
    @Body() dto: UpdateItemControlDto,
  ) {
    return this.itemControlService.update(idControl, idItem, dto);
  }

  @RequirePermissions('logistica.editar')
  @Delete(':idItem')
  remove(
    @Param('idControl', ParseIntPipe) idControl: number,
    @Param('idItem', ParseIntPipe) idItem: number,
  ) {
    return this.itemControlService.remove(idControl, idItem);
  }
}
