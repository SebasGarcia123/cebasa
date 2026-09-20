import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreateTransporteDto } from './dto/create-transporte.dto.js';
import { UpdateTransporteDto } from './dto/update-transporte.dto.js';

@Injectable()
export class TransporteService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateTransporteDto) {
    return this.prisma.transporte.create({ data: dto });
  }

  findAll() {
    return this.prisma.transporte.findMany({
      include: { direcciones: true, estados: true, camion: true, chofer: true },
    });
  }

  async findOne(id: number) {
    const transporte = await this.prisma.transporte.findUnique({
      where: { id_transporte: id },
      include: { direcciones: true, estados: true, camion: true, chofer: true },
    });
    if (!transporte) {
      throw new NotFoundException(`Transporte ${id} no encontrado`);
    }
    return transporte;
  }

  async update(id: number, dto: UpdateTransporteDto) {
    await this.findOne(id);
    return this.prisma.transporte.update({
      where: { id_transporte: id },
      data: dto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.transporte.delete({ where: { id_transporte: id } });
  }
}
