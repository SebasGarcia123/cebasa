import { Body, Controller, Delete, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { ItemPlanProduccionService } from './item-plan-produccion.service.js';
import { CreateItemPlanProduccionDto } from './dto/create-item-plan-produccion.dto.js';
import { UpdateItemPlanProduccionDto } from './dto/update-item-plan-produccion.dto.js';
import { ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../../../auth/decorators/permissions.decorator.js';
import { CurrentUser } from '../../../../auth/decorators/current-user.decorator.js';
import type { JwtPayload } from '../../../../auth/types/jwt-payload.interface.js';

// Rutas planas (no anidadas bajo un id de plan): el plan de la semana
// se resuelve solo a partir de la fecha del ítem, el cliente nunca
// necesita conocer/mandar un id_plan_produccion (ver
// PlanProduccionService.obtenerOCrearPlan).
@ApiTags('Plan Produccion - Items')
@Controller('planes-produccion/items')
export class ItemPlanProduccionController {
  constructor(private readonly itemService: ItemPlanProduccionService) {}

  @RequirePermissions('produccion.plan_produccion.editar')
  @Post()
  create(@Body() dto: CreateItemPlanProduccionDto, @CurrentUser() user: JwtPayload) {
    return this.itemService.create(dto, user.sub);
  }

  @RequirePermissions('produccion.plan_produccion.editar')
  @Patch(':idItem')
  update(@Param('idItem', ParseIntPipe) idItem: number, @Body() dto: UpdateItemPlanProduccionDto) {
    return this.itemService.update(idItem, dto);
  }

  @RequirePermissions('produccion.plan_produccion.editar')
  @Delete(':idItem')
  remove(@Param('idItem', ParseIntPipe) idItem: number) {
    return this.itemService.remove(idItem);
  }
}
