import { Module } from '@nestjs/common';
import { RolesModule } from './roles/roles.module.js';
import { PermisosModule } from './permisos/permisos.module.js';
import { UsuariosEntityModule } from './usuarios/usuarios.module.js';
import { UsuarioRolesModule } from './usuario-roles/usuario-roles.module.js';
import { RolPermisosModule } from './rol-permisos/rol-permisos.module.js';

@Module({
  imports: [
    RolesModule,
    PermisosModule,
    UsuariosEntityModule,
    UsuarioRolesModule,
    RolPermisosModule,
  ],
})
export class UsuariosModule {}
