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
import { UsuariosService } from './usuarios.service.js';
import { CreateUsuarioDto } from './dto/create-usuario.dto.js';
import { UpdateUsuarioDto } from './dto/update-usuario.dto.js';
import { ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../../auth/decorators/permissions.decorator.js';

@ApiTags('Usuarios')
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @RequirePermissions('usuarios.administrar')
  @Post()
  create(@Body() dto: CreateUsuarioDto) {
    return this.usuariosService.create(dto);
  }

  @RequirePermissions('usuarios.ver')
  @Get()
  findAll() {
    return this.usuariosService.findAll();
  }

  @RequirePermissions('usuarios.ver')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usuariosService.findOne(id);
  }

  @RequirePermissions('usuarios.administrar')
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUsuarioDto) {
    return this.usuariosService.update(id, dto);
  }

  @RequirePermissions('usuarios.administrar')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usuariosService.remove(id);
  }
}
