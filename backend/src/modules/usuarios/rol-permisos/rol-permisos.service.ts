import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';

@Injectable()
export class RolPermisosService {
  constructor(private readonly prisma: PrismaService) {}

  findAllForRol(idRol: number) {
    return this.prisma.rol_permisos.findMany({
      where: { id_rol: idRol },
      include: { permisos: true },
    });
  }

  assign(idRol: number, idPermiso: number) {
    return this.prisma.rol_permisos.create({
      data: { id_rol: idRol, id_permiso: idPermiso },
      include: { permisos: true },
    });
  }

  async remove(idRol: number, idPermiso: number) {
    try {
      return await this.prisma.rol_permisos.delete({
        where: { id_rol_id_permiso: { id_rol: idRol, id_permiso: idPermiso } },
      });
    } catch {
      throw new NotFoundException(`El rol ${idRol} no tiene asignado el permiso ${idPermiso}`);
    }
  }
}
