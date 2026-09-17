import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreateRolDto } from './dto/create-rol.dto.js';
import { UpdateRolDto } from './dto/update-rol.dto.js';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateRolDto) {
    return this.prisma.roles.create({ data: dto });
  }

  findAll() {
    return this.prisma.roles.findMany();
  }

  async findOne(id: number) {
    const rol = await this.prisma.roles.findUnique({ where: { id_rol: id } });
    if (!rol) {
      throw new NotFoundException(`Rol ${id} no encontrado`);
    }
    return rol;
  }

  async update(id: number, dto: UpdateRolDto) {
    await this.findOne(id);
    return this.prisma.roles.update({ where: { id_rol: id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.roles.delete({ where: { id_rol: id } });
  }
}
