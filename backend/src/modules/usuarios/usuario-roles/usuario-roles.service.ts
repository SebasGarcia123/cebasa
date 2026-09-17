import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';

@Injectable()
export class UsuarioRolesService {
  constructor(private readonly prisma: PrismaService) {}

  findAllForUsuario(idUsuario: number) {
    return this.prisma.usuario_roles.findMany({
      where: { id_usuario: idUsuario },
      include: { roles: true },
    });
  }

  assign(idUsuario: number, idRol: number) {
    return this.prisma.usuario_roles.create({
      data: { id_usuario: idUsuario, id_rol: idRol },
      include: { roles: true },
    });
  }

  async remove(idUsuario: number, idRol: number) {
    try {
      return await this.prisma.usuario_roles.delete({
        where: { id_usuario_id_rol: { id_usuario: idUsuario, id_rol: idRol } },
      });
    } catch {
      throw new NotFoundException(`El usuario ${idUsuario} no tiene asignado el rol ${idRol}`);
    }
  }
}
