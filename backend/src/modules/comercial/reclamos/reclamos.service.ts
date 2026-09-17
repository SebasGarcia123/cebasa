import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreateReclamoDto } from './dto/create-reclamo.dto.js';
import { UpdateReclamoDto } from './dto/update-reclamo.dto.js';

@Injectable()
export class ReclamosService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateReclamoDto) {
    return this.prisma.reclamos.create({
      data: { ...dto, fecha: new Date(dto.fecha) },
    });
  }

  findAll() {
    return this.prisma.reclamos.findMany({
      include: { clientes: true, estados: true },
    });
  }

  async findOne(id: number) {
    const reclamo = await this.prisma.reclamos.findUnique({
      where: { id_reclamo: id },
      include: { clientes: true, estados: true, usuarios: true },
    });
    if (!reclamo) {
      throw new NotFoundException(`Reclamo ${id} no encontrado`);
    }
    return reclamo;
  }

  async update(id: number, dto: UpdateReclamoDto) {
    await this.findOne(id);
    return this.prisma.reclamos.update({
      where: { id_reclamo: id },
      data: {
        ...dto,
        fecha: dto.fecha ? new Date(dto.fecha) : undefined,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.reclamos.delete({ where: { id_reclamo: id } });
  }
}
