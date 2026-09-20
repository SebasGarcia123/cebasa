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
import { DireccionesService } from './direcciones.service.js';
import { CreateDireccionDto } from './dto/create-direccion.dto.js';
import { UpdateDireccionDto } from './dto/update-direccion.dto.js';
import { ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../../auth/decorators/permissions.decorator.js';

@ApiTags('Direcciones')
@Controller('direcciones')
export class DireccionesController {
  constructor(private readonly direccionesService: DireccionesService) {}

  @RequirePermissions('catalogos.editar')
  @Post()
  create(@Body() dto: CreateDireccionDto) {
    return this.direccionesService.create(dto);
  }

  @Get()
  findAll() {
    return this.direccionesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.direccionesService.findOne(id);
  }

  @RequirePermissions('catalogos.editar')
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDireccionDto,
  ) {
    return this.direccionesService.update(id, dto);
  }

  @RequirePermissions('catalogos.editar')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.direccionesService.remove(id);
  }
}
