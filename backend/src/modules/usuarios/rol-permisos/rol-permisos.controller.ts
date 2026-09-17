import { Controller, Delete, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { RolPermisosService } from './rol-permisos.service.js';

@Controller('roles/:idRol/permisos')
export class RolPermisosController {
  constructor(private readonly rolPermisosService: RolPermisosService) {}

  @Get()
  findAll(@Param('idRol', ParseIntPipe) idRol: number) {
    return this.rolPermisosService.findAllForRol(idRol);
  }

  @Post(':idPermiso')
  assign(
    @Param('idRol', ParseIntPipe) idRol: number,
    @Param('idPermiso', ParseIntPipe) idPermiso: number,
  ) {
    return this.rolPermisosService.assign(idRol, idPermiso);
  }

  @Delete(':idPermiso')
  remove(
    @Param('idRol', ParseIntPipe) idRol: number,
    @Param('idPermiso', ParseIntPipe) idPermiso: number,
  ) {
    return this.rolPermisosService.remove(idRol, idPermiso);
  }
}
