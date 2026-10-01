import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { RolPermisosService } from './rol-permisos.service.js';
import { ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../../auth/decorators/permissions.decorator.js';

@ApiTags('Rol Permisos')
@Controller('roles/:idRol/permisos')
export class RolPermisosController {
  constructor(private readonly rolPermisosService: RolPermisosService) {}

  @RequirePermissions('usuarios.roles.editar')
  @Get()
  findAll(@Param('idRol', ParseIntPipe) idRol: number) {
    return this.rolPermisosService.findAllForRol(idRol);
  }

  @RequirePermissions('usuarios.roles.editar')
  @Post(':idPermiso')
  assign(
    @Param('idRol', ParseIntPipe) idRol: number,
    @Param('idPermiso', ParseIntPipe) idPermiso: number,
  ) {
    return this.rolPermisosService.assign(idRol, idPermiso);
  }

  @RequirePermissions('usuarios.roles.editar')
  @Delete(':idPermiso')
  remove(
    @Param('idRol', ParseIntPipe) idRol: number,
    @Param('idPermiso', ParseIntPipe) idPermiso: number,
  ) {
    return this.rolPermisosService.remove(idRol, idPermiso);
  }
}
