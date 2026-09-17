import { Module } from '@nestjs/common';
import { RolPermisosService } from './rol-permisos.service.js';
import { RolPermisosController } from './rol-permisos.controller.js';

@Module({
  controllers: [RolPermisosController],
  providers: [RolPermisosService],
})
export class RolPermisosModule {}
