import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreateEstadoDto } from './dto/create-estado.dto.js';
import { UpdateEstadoDto } from './dto/update-estado.dto.js';

@Injectable()
export class EstadosService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateEstadoDto) {
    return this.prisma.estados.create({ data: dto });
  }

  findAll() {
    return this.prisma.estados.findMany();
  }

  async findOne(id: number) {
    const estado = await this.prisma.estados.findUnique({
      where: { id_estado: id },
    });
    if (!estado) {
      throw new NotFoundException(`Estado ${id} no encontrado`);
    }
    return estado;
  }

  async update(id: number, dto: UpdateEstadoDto) {
    await this.findOne(id);
    return this.prisma.estados.update({ where: { id_estado: id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.estados.delete({ where: { id_estado: id } });
  }
}
