import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreateLoteProdDto } from './dto/create-lote-prod.dto.js';
import { UpdateLoteProdDto } from './dto/update-lote-prod.dto.js';

@Injectable()
export class LoteProdService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateLoteProdDto) {
    return this.prisma.lote_prod.create({
      data: { ...dto, fecha_lote_prod: new Date(dto.fecha_lote_prod) },
    });
  }

  findAll() {
    return this.prisma.lote_prod.findMany({
      include: { turnos: true, estados: true },
    });
  }

  async findOne(id: number) {
    const lote = await this.prisma.lote_prod.findUnique({
      where: { id_lote: id },
      include: {
        turnos: true,
        estados: true,
        item_prod: { include: { productos: true, lineas: true } },
      },
    });
    if (!lote) {
      throw new NotFoundException(`Lote de producción ${id} no encontrado`);
    }
    return lote;
  }

  async update(id: number, dto: UpdateLoteProdDto) {
    await this.findOne(id);
    return this.prisma.lote_prod.update({
      where: { id_lote: id },
      data: {
        ...dto,
        fecha_lote_prod: dto.fecha_lote_prod
          ? new Date(dto.fecha_lote_prod)
          : undefined,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.lote_prod.delete({ where: { id_lote: id } });
  }
}
