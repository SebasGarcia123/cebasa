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
import { PermisosService } from './permisos.service.js';
import { CreatePermisoDto } from './dto/create-permiso.dto.js';
import { UpdatePermisoDto } from './dto/update-permiso.dto.js';
import { ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../../auth/decorators/permissions.decorator.js';

@ApiTags('Permisos')
@Controller('permisos')
export class PermisosController {
  constructor(private readonly permisosService: PermisosService) {}

  @RequirePermissions('usuarios.administrar')
  @Post()
  create(@Body() dto: CreatePermisoDto) {
    return this.permisosService.create(dto);
  }

  @RequirePermissions('usuarios.ver')
  @Get()
  findAll() {
    return this.permisosService.findAll();
  }

  @RequirePermissions('usuarios.ver')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.permisosService.findOne(id);
  }

  @RequirePermissions('usuarios.administrar')
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePermisoDto) {
    return this.permisosService.update(id, dto);
  }

  @RequirePermissions('usuarios.administrar')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.permisosService.remove(id);
  }
}
