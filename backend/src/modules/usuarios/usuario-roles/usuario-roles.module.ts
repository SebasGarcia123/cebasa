import { Module } from '@nestjs/common';
import { UsuarioRolesService } from './usuario-roles.service.js';
import { UsuarioRolesController } from './usuario-roles.controller.js';

@Module({
  controllers: [UsuarioRolesController],
  providers: [UsuarioRolesService],
})
export class UsuarioRolesModule {}
