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
import { ItemPlanProduccionService } from './item-plan-produccion.service.js';
import { CreateItemPlanProduccionDto } from './dto/create-item-plan-produccion.dto.js';
import { UpdateItemPlanProduccionDto } from './dto/update-item-plan-produccion.dto.js';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Plan Produccion - Items')
@Controller('planes-produccion/:idPlan/items')
export class ItemPlanProduccionController {
  constructor(private readonly itemService: ItemPlanProduccionService) {}

  @Get()
  findAll(@Param('idPlan', ParseIntPipe) idPlan: number) {
    return this.itemService.findAllForPlan(idPlan);
  }

  @Post()
  create(
    @Param('idPlan', ParseIntPipe) idPlan: number,
    @Body() dto: CreateItemPlanProduccionDto,
  ) {
    return this.itemService.create(idPlan, dto);
  }

  @Get(':idItem')
  findOne(
    @Param('idPlan', ParseIntPipe) idPlan: number,
    @Param('idItem', ParseIntPipe) idItem: number,
  ) {
    return this.itemService.findOne(idPlan, idItem);
  }

  @Patch(':idItem')
  update(
    @Param('idPlan', ParseIntPipe) idPlan: number,
    @Param('idItem', ParseIntPipe) idItem: number,
    @Body() dto: UpdateItemPlanProduccionDto,
  ) {
    return this.itemService.update(idPlan, idItem, dto);
  }

  @Delete(':idItem')
  remove(
    @Param('idPlan', ParseIntPipe) idPlan: number,
    @Param('idItem', ParseIntPipe) idItem: number,
  ) {
    return this.itemService.remove(idPlan, idItem);
  }
}
