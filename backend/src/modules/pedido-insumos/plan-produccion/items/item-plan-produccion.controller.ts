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
import { RequirePermissions } from '../../../../auth/decorators/permissions.decorator.js';

@ApiTags('Plan Produccion - Items')
@Controller('planes-produccion/:idPlan/items')
export class ItemPlanProduccionController {
  constructor(private readonly itemService: ItemPlanProduccionService) {}

  @RequirePermissions('pedido_insumos.ver')
  @Get()
  findAll(@Param('idPlan', ParseIntPipe) idPlan: number) {
    return this.itemService.findAllForPlan(idPlan);
  }

  @RequirePermissions('pedido_insumos.editar')
  @Post()
  create(
    @Param('idPlan', ParseIntPipe) idPlan: number,
    @Body() dto: CreateItemPlanProduccionDto,
  ) {
    return this.itemService.create(idPlan, dto);
  }

  @RequirePermissions('pedido_insumos.ver')
  @Get(':idItem')
  findOne(
    @Param('idPlan', ParseIntPipe) idPlan: number,
    @Param('idItem', ParseIntPipe) idItem: number,
  ) {
    return this.itemService.findOne(idPlan, idItem);
  }

  @RequirePermissions('pedido_insumos.editar')
  @Patch(':idItem')
  update(
    @Param('idPlan', ParseIntPipe) idPlan: number,
    @Param('idItem', ParseIntPipe) idItem: number,
    @Body() dto: UpdateItemPlanProduccionDto,
  ) {
    return this.itemService.update(idPlan, idItem, dto);
  }

  @RequirePermissions('pedido_insumos.editar')
  @Delete(':idItem')
  remove(
    @Param('idPlan', ParseIntPipe) idPlan: number,
    @Param('idItem', ParseIntPipe) idItem: number,
  ) {
    return this.itemService.remove(idPlan, idItem);
  }
}
