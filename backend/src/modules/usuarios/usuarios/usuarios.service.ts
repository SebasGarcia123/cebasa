import { Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreateUsuarioDto } from './dto/create-usuario.dto.js';
import { UpdateUsuarioDto } from './dto/update-usuario.dto.js';

const SALT_ROUNDS = 10;

@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUsuarioDto) {
    const password = await bcrypt.hash(dto.password, SALT_ROUNDS);
    return this.prisma.usuarios.create({
      data: { ...dto, password },
      omit: { password: true },
    });
  }

  findAll() {
    return this.prisma.usuarios.findMany({
      include: { sectores: true, estados: true },
      omit: { password: true },
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
      omit: { password: true },
    });
    if (!usuario) {
      throw new NotFoundException(`Usuario ${id} no encontrado`);
    }
    return usuario;
  }

  async update(id: number, dto: UpdateUsuarioDto) {
    await this.findOne(id);
    const { password, ...rest } = dto;
    return this.prisma.usuarios.update({
      where: { id_usuario: id },
      data: {
        ...rest,
        ...(password ? { password: await bcrypt.hash(password, SALT_ROUNDS) } : {}),
      },
      omit: { password: true },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.usuarios.delete({ where: { id_usuario: id }, omit: { password: true } });
  }
}
