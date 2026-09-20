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
import { EstadosService } from './estados.service.js';
import { CreateEstadoDto } from './dto/create-estado.dto.js';
import { UpdateEstadoDto } from './dto/update-estado.dto.js';
import { ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../../auth/decorators/permissions.decorator.js';

@ApiTags('Estados')
@Controller('estados')
export class EstadosController {
  constructor(private readonly estadosService: EstadosService) {}

  @RequirePermissions('catalogos.editar')
  @Post()
  create(@Body() dto: CreateEstadoDto) {
    return this.estadosService.create(dto);
  }

  @Get()
  findAll() {
    return this.estadosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.estadosService.findOne(id);
  }

  @RequirePermissions('catalogos.editar')
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateEstadoDto) {
    return this.estadosService.update(id, dto);
  }

  @RequirePermissions('catalogos.editar')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.estadosService.remove(id);
  }
}
