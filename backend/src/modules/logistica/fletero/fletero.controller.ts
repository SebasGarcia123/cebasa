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
import { FleteroService } from './fletero.service.js';
import { CreateFleteroDto } from './dto/create-fletero.dto.js';
import { UpdateFleteroDto } from './dto/update-fletero.dto.js';
import { ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../../auth/decorators/permissions.decorator.js';

@ApiTags('Fletero')
@Controller('fletero')
export class FleteroController {
  constructor(private readonly fleteroService: FleteroService) {}

  @RequirePermissions('logistica.fleteros.editar')
  @Post()
  create(@Body() dto: CreateFleteroDto) {
    return this.fleteroService.create(dto);
  }

  @RequirePermissions('logistica.fleteros.editar')
  @Get()
  findAll() {
    return this.fleteroService.findAll();
  }

  @RequirePermissions('logistica.fleteros.editar')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.fleteroService.findOne(id);
  }

  @RequirePermissions('logistica.fleteros.editar')
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateFleteroDto) {
    return this.fleteroService.update(id, dto);
  }

  @RequirePermissions('logistica.fleteros.editar')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.fleteroService.remove(id);
  }
}
