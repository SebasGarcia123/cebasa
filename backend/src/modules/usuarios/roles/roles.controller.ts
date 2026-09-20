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
import { RolesService } from './roles.service.js';
import { CreateRolDto } from './dto/create-rol.dto.js';
import { UpdateRolDto } from './dto/update-rol.dto.js';
import { ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../../auth/decorators/permissions.decorator.js';

@ApiTags('Roles')
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @RequirePermissions('usuarios.administrar')
  @Post()
  create(@Body() dto: CreateRolDto) {
    return this.rolesService.create(dto);
  }

  @RequirePermissions('usuarios.ver')
  @Get()
  findAll() {
    return this.rolesService.findAll();
  }

  @RequirePermissions('usuarios.ver')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.findOne(id);
  }

  @RequirePermissions('usuarios.administrar')
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRolDto) {
    return this.rolesService.update(id, dto);
  }

  @RequirePermissions('usuarios.administrar')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.remove(id);
  }
}
