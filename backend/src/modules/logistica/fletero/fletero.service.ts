import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreateFleteroDto } from './dto/create-fletero.dto.js';
import { UpdateFleteroDto } from './dto/update-fletero.dto.js';

@Injectable()
export class FleteroService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateFleteroDto) {
    return this.prisma.fletero.create({ data: dto });
  }

  findAll() {
    return this.prisma.fletero.findMany();
  }

  async findOne(id: number) {
    const fletero = await this.prisma.fletero.findUnique({
      where: { id_fletero: id },
    });
    if (!fletero) {
      throw new NotFoundException(`Fletero ${id} no encontrado`);
    }
    return fletero;
  }

  async update(id: number, dto: UpdateFleteroDto) {
    await this.findOne(id);
    return this.prisma.fletero.update({ where: { id_fletero: id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.fletero.delete({ where: { id_fletero: id } });
  }
}
