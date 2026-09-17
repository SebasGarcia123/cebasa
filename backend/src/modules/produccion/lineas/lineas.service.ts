import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreateLineaDto } from './dto/create-linea.dto.js';
import { UpdateLineaDto } from './dto/update-linea.dto.js';

@Injectable()
export class LineasService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateLineaDto) {
    return this.prisma.lineas.create({ data: dto });
  }

  findAll() {
    return this.prisma.lineas.findMany();
  }

  async findOne(id: number) {
    const linea = await this.prisma.lineas.findUnique({ where: { id_lineas: id } });
    if (!linea) {
      throw new NotFoundException(`Línea ${id} no encontrada`);
    }
    return linea;
  }

  async update(id: number, dto: UpdateLineaDto) {
    await this.findOne(id);
    return this.prisma.lineas.update({ where: { id_lineas: id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.lineas.delete({ where: { id_lineas: id } });
  }
}
