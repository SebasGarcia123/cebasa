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
import { TurnosService } from './turnos.service.js';
import { CreateTurnoDto } from './dto/create-turno.dto.js';
import { UpdateTurnoDto } from './dto/update-turno.dto.js';
import { ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../../auth/decorators/permissions.decorator.js';

@ApiTags('Turnos')
@Controller('turnos')
export class TurnosController {
  constructor(private readonly turnosService: TurnosService) {}

  @RequirePermissions('produccion.editar')
  @Post()
  create(@Body() dto: CreateTurnoDto) {
    return this.turnosService.create(dto);
  }

  @RequirePermissions('produccion.ver')
  @Get()
  findAll() {
    return this.turnosService.findAll();
  }

  @RequirePermissions('produccion.ver')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.turnosService.findOne(id);
  }

  @RequirePermissions('produccion.editar')
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTurnoDto) {
    return this.turnosService.update(id, dto);
  }

  @RequirePermissions('produccion.editar')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.turnosService.remove(id);
  }
}
