import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreateUsuarioDto } from './dto/create-usuario.dto.js';
import { UpdateUsuarioDto } from './dto/update-usuario.dto.js';

@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateUsuarioDto) {
    return this.prisma.usuarios.create({ data: dto });
  }

  findAll() {
    return this.prisma.usuarios.findMany({
      include: { sectores: true, estados: true },
    });
  }

  async findOne(id: number) {
    const usuario = await this.prisma.usuarios.findUnique({
      where: { id_usuario: id },
      include: {
        sectores: true,
        estados: true,
        usuario_roles: { include: { roles: true } },
      },
    });
    if (!usuario) {
      throw new NotFoundException(`Usuario ${id} no encontrado`);
    }
    return usuario;
  }

  async update(id: number, dto: UpdateUsuarioDto) {
    await this.findOne(id);
    return this.prisma.usuarios.update({ where: { id_usuario: id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.usuarios.delete({ where: { id_usuario: id } });
  }
}
