import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreateLoteDto } from './dto/create-lote.dto.js';
import { UpdateLoteDto } from './dto/update-lote.dto.js';

@Injectable()
export class LotesService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateLoteDto) {
    return this.prisma.lotes.create({
      data: { ...dto, fecha_lote: new Date(dto.fecha_lote) },
    });
  }

  findAll() {
    return this.prisma.lotes.findMany({
      include: { chofer: true, camion: true, tipo_lote: true, estados: true },
    });
  }

  async findOne(id: number) {
    const lote = await this.prisma.lotes.findUnique({
      where: { id_lote: id },
      include: {
        chofer: true,
        camion: true,
        tipo_lote: true,
        estados: true,
        item_lote: { include: { unidad_medida: true } },
      },
    });
    if (!lote) {
      throw new NotFoundException(`Lote ${id} no encontrado`);
    }
    return lote;
  }

  async update(id: number, dto: UpdateLoteDto) {
    await this.findOne(id);
    return this.prisma.lotes.update({
      where: { id_lote: id },
      data: {
        ...dto,
        fecha_lote: dto.fecha_lote ? new Date(dto.fecha_lote) : undefined,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.lotes.delete({ where: { id_lote: id } });
  }
}
