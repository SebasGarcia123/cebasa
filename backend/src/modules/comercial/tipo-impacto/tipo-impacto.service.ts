import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreateTipoImpactoDto } from './dto/create-tipo-impacto.dto.js';
import { UpdateTipoImpactoDto } from './dto/update-tipo-impacto.dto.js';

@Injectable()
export class TipoImpactoService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateTipoImpactoDto) {
    return this.prisma.tipo_impacto.create({ data: dto });
  }

  findAll() {
    return this.prisma.tipo_impacto.findMany();
  }

  async findOne(id: number) {
    const tipoImpacto = await this.prisma.tipo_impacto.findUnique({
      where: { id_tipo_impacto: id },
    });
    if (!tipoImpacto) {
      throw new NotFoundException(`Tipo de impacto ${id} no encontrado`);
    }
    return tipoImpacto;
  }

  async update(id: number, dto: UpdateTipoImpactoDto) {
    await this.findOne(id);
    return this.prisma.tipo_impacto.update({
      where: { id_tipo_impacto: id },
      data: dto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.tipo_impacto.delete({ where: { id_tipo_impacto: id } });
  }
}
