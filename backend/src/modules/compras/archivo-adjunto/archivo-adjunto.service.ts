import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreateArchivoAdjuntoDto } from './dto/create-archivo-adjunto.dto.js';
import { UpdateArchivoAdjuntoDto } from './dto/update-archivo-adjunto.dto.js';

@Injectable()
export class ArchivoAdjuntoService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateArchivoAdjuntoDto) {
    return this.prisma.archivo_adjunto.create({
      data: { ...dto, fecha_carga: new Date(dto.fecha_carga) },
    });
  }

  findAll() {
    return this.prisma.archivo_adjunto.findMany();
  }

  async findOne(id: number) {
    const archivo = await this.prisma.archivo_adjunto.findUnique({
      where: { id_archivo_adjunto: id },
    });
    if (!archivo) {
      throw new NotFoundException(`Archivo adjunto ${id} no encontrado`);
    }
    return archivo;
  }

  async update(id: number, dto: UpdateArchivoAdjuntoDto) {
    await this.findOne(id);
    return this.prisma.archivo_adjunto.update({
      where: { id_archivo_adjunto: id },
      data: {
        ...dto,
        fecha_carga: dto.fecha_carga ? new Date(dto.fecha_carga) : undefined,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.archivo_adjunto.delete({
      where: { id_archivo_adjunto: id },
    });
  }
}
