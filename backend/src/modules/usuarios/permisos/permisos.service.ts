import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreatePermisoDto } from './dto/create-permiso.dto.js';
import { UpdatePermisoDto } from './dto/update-permiso.dto.js';

@Injectable()
export class PermisosService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreatePermisoDto) {
    return this.prisma.permisos.create({ data: dto });
  }

  findAll() {
    return this.prisma.permisos.findMany();
  }

  async findOne(id: number) {
    const permiso = await this.prisma.permisos.findUnique({
      where: { id_permiso: id },
    });
    if (!permiso) {
      throw new NotFoundException(`Permiso ${id} no encontrado`);
    }
    return permiso;
  }

  async update(id: number, dto: UpdatePermisoDto) {
    await this.findOne(id);
    return this.prisma.permisos.update({
      where: { id_permiso: id },
      data: dto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.permisos.delete({ where: { id_permiso: id } });
  }
}
