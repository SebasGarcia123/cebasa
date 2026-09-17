import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreateTipoLoteDto } from './dto/create-tipo-lote.dto.js';
import { UpdateTipoLoteDto } from './dto/update-tipo-lote.dto.js';

@Injectable()
export class TipoLoteService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateTipoLoteDto) {
    return this.prisma.tipo_lote.create({ data: dto });
  }

  findAll() {
    return this.prisma.tipo_lote.findMany();
  }

  async findOne(id: number) {
    const tipoLote = await this.prisma.tipo_lote.findUnique({ where: { id_tipo_lote: id } });
    if (!tipoLote) {
      throw new NotFoundException(`Tipo de lote ${id} no encontrado`);
    }
    return tipoLote;
  }

  async update(id: number, dto: UpdateTipoLoteDto) {
    await this.findOne(id);
    return this.prisma.tipo_lote.update({ where: { id_tipo_lote: id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.tipo_lote.delete({ where: { id_tipo_lote: id } });
  }
}
