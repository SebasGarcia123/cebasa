import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreateTipoDocumentoDto } from './dto/create-tipo-documento.dto.js';
import { UpdateTipoDocumentoDto } from './dto/update-tipo-documento.dto.js';

@Injectable()
export class TipoDocumentoService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateTipoDocumentoDto) {
    return this.prisma.tipo_documento.create({ data: dto });
  }

  findAll() {
    return this.prisma.tipo_documento.findMany({
      include: { tipo_impacto: true },
    });
  }

  async findOne(id: number) {
    const tipoDocumento = await this.prisma.tipo_documento.findUnique({
      where: { id_tipo_documento: id },
      include: { tipo_impacto: true },
    });
    if (!tipoDocumento) {
      throw new NotFoundException(`Tipo de documento ${id} no encontrado`);
    }
    return tipoDocumento;
  }

  async update(id: number, dto: UpdateTipoDocumentoDto) {
    await this.findOne(id);
    return this.prisma.tipo_documento.update({
      where: { id_tipo_documento: id },
      data: dto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.tipo_documento.delete({
      where: { id_tipo_documento: id },
    });
  }
}
