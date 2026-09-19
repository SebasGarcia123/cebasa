import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreateSectorDto } from './dto/create-sector.dto.js';
import { UpdateSectorDto } from './dto/update-sector.dto.js';

@Injectable()
export class SectoresService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateSectorDto) {
    return this.prisma.sectores.create({ data: dto });
  }

  findAll() {
    return this.prisma.sectores.findMany();
  }

  async findOne(id: number) {
    const sector = await this.prisma.sectores.findUnique({
      where: { id_sector: id },
    });
    if (!sector) {
      throw new NotFoundException(`Sector ${id} no encontrado`);
    }
    return sector;
  }

  async update(id: number, dto: UpdateSectorDto) {
    await this.findOne(id);
    return this.prisma.sectores.update({ where: { id_sector: id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.sectores.delete({ where: { id_sector: id } });
  }
}
