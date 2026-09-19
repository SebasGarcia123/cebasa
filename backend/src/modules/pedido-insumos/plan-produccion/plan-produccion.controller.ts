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

@ApiTags('Plan Produccion')
@Controller('planes-produccion')
export class PlanProduccionController {
  constructor(private readonly planProduccionService: PlanProduccionService) {}

  @Post()
  create(@Body() dto: CreatePlanProduccionDto) {
    return this.planProduccionService.create(dto);
  }

  @Get()
  findAll() {
    return this.planProduccionService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.planProduccionService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePlanProduccionDto,
  ) {
    return this.planProduccionService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.planProduccionService.remove(id);
  }
}
