import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreateNaturalezaDto } from './dto/create-naturaleza.dto.js';
import { UpdateNaturalezaDto } from './dto/update-naturaleza.dto.js';

@Injectable()
export class NaturalezaService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateNaturalezaDto) {
    return this.prisma.naturaleza.create({ data: dto });
  }

  findAll() {
    return this.prisma.naturaleza.findMany();
  }

  async findOne(id: number) {
    const naturaleza = await this.prisma.naturaleza.findUnique({
      where: { id_naturaleza: id },
    });
    if (!naturaleza) {
      throw new NotFoundException(`Naturaleza ${id} no encontrada`);
    }
    return naturaleza;
  }

  async update(id: number, dto: UpdateNaturalezaDto) {
    await this.findOne(id);
    return this.prisma.naturaleza.update({ where: { id_naturaleza: id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.naturaleza.delete({ where: { id_naturaleza: id } });
  }
}
