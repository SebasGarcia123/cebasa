import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreateDireccionDto } from './dto/create-direccion.dto.js';
import { UpdateDireccionDto } from './dto/update-direccion.dto.js';

@Injectable()
export class DireccionesService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateDireccionDto) {
    return this.prisma.direcciones.create({ data: dto });
  }

  findAll() {
    return this.prisma.direcciones.findMany();
  }

  async findOne(id: number) {
    const direccion = await this.prisma.direcciones.findUnique({
      where: { id_direccion: id },
    });
    if (!direccion) {
      throw new NotFoundException(`Dirección ${id} no encontrada`);
    }
    return direccion;
  }

  async update(id: number, dto: UpdateDireccionDto) {
    await this.findOne(id);
    return this.prisma.direcciones.update({
      where: { id_direccion: id },
      data: dto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.direcciones.delete({ where: { id_direccion: id } });
  }
}
