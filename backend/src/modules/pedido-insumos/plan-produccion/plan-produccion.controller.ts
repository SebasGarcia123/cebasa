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
import { PlanProduccionService } from './plan-produccion.service.js';
import { CreatePlanProduccionDto } from './dto/create-plan-produccion.dto.js';
import { UpdatePlanProduccionDto } from './dto/update-plan-produccion.dto.js';
import { ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../../auth/decorators/permissions.decorator.js';

@ApiTags('Plan Produccion')
@Controller('planes-produccion')
export class PlanProduccionController {
  constructor(private readonly planProduccionService: PlanProduccionService) {}

  @RequirePermissions('pedido_insumos.editar')
  @Post()
  create(@Body() dto: CreatePlanProduccionDto) {
    return this.planProduccionService.create(dto);
  }

  @RequirePermissions('pedido_insumos.ver')
  @Get()
  findAll() {
    return this.planProduccionService.findAll();
  }

  @RequirePermissions('pedido_insumos.ver')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.planProduccionService.findOne(id);
  }

  @RequirePermissions('pedido_insumos.editar')
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePlanProduccionDto,
  ) {
    return this.planProduccionService.update(id, dto);
  }

  @RequirePermissions('pedido_insumos.editar')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.planProduccionService.remove(id);
  }
}
