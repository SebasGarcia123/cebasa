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

  @RequirePermissions('usuarios.ver')
  @Get()
  findAll(@Param('idRol', ParseIntPipe) idRol: number) {
    return this.rolPermisosService.findAllForRol(idRol);
  }

  @RequirePermissions('usuarios.administrar')
  @Post(':idPermiso')
  assign(
    @Param('idRol', ParseIntPipe) idRol: number,
    @Param('idPermiso', ParseIntPipe) idPermiso: number,
  ) {
    return this.rolPermisosService.assign(idRol, idPermiso);
  }

  @RequirePermissions('usuarios.administrar')
  @Delete(':idPermiso')
  remove(
    @Param('idRol', ParseIntPipe) idRol: number,
    @Param('idPermiso', ParseIntPipe) idPermiso: number,
  ) {
    return this.rolPermisosService.remove(idRol, idPermiso);
  }
}
