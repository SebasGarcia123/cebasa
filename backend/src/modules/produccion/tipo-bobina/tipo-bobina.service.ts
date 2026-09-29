import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreateTipoBobinaDto } from './dto/create-tipo-bobina.dto.js';
import { UpdateTipoBobinaDto } from './dto/update-tipo-bobina.dto.js';

@Injectable()
export class TipoBobinaService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateTipoBobinaDto) {
    return this.prisma.tipo_bobina.create({ data: dto });
  }

  findAll() {
    return this.prisma.tipo_bobina.findMany();
  }

  async findOne(id: number) {
    const tipoBobina = await this.prisma.tipo_bobina.findUnique({ where: { id_tipo_bobina: id } });
    if (!tipoBobina) {
      throw new NotFoundException(`Tipo de bobina ${id} no encontrado`);
    }
    return tipoBobina;
  }

  async update(id: number, dto: UpdateTipoBobinaDto) {
    await this.findOne(id);
    return this.prisma.tipo_bobina.update({ where: { id_tipo_bobina: id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.tipo_bobina.delete({ where: { id_tipo_bobina: id } });
  }
}
