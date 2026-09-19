import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { UsuarioRolesService } from './usuario-roles.service.js';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Usuario Roles')
@Controller('usuarios/:idUsuario/roles')
export class UsuarioRolesController {
  constructor(private readonly usuarioRolesService: UsuarioRolesService) {}

  @Get()
  findAll(@Param('idUsuario', ParseIntPipe) idUsuario: number) {
    return this.usuarioRolesService.findAllForUsuario(idUsuario);
  }

  @Post(':idRol')
  assign(
    @Param('idUsuario', ParseIntPipe) idUsuario: number,
    @Param('idRol', ParseIntPipe) idRol: number,
  ) {
    return this.usuarioRolesService.assign(idUsuario, idRol);
  }

  @Delete(':idRol')
  remove(
    @Param('idUsuario', ParseIntPipe) idUsuario: number,
    @Param('idRol', ParseIntPipe) idRol: number,
  ) {
    return this.usuarioRolesService.remove(idUsuario, idRol);
  }
}
