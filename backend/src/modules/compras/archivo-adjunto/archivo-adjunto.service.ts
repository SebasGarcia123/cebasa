import { Injectable, NotFoundException } from '@nestjs/common';
import { join, normalize } from 'node:path';
import { rm } from 'node:fs/promises';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreateArchivoAdjuntoDto } from './dto/create-archivo-adjunto.dto.js';
import { UpdateArchivoAdjuntoDto } from './dto/update-archivo-adjunto.dto.js';
import { UPLOADS_DIR } from './archivo-adjunto.storage.js';

@Injectable()
export class ArchivoAdjuntoService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateArchivoAdjuntoDto) {
    return this.prisma.archivo_adjunto.create({
      data: { ...dto, fecha_carga: new Date(dto.fecha_carga) },
    });
  }

  createFromUpload(file: Express.Multer.File) {
    return this.prisma.archivo_adjunto.create({
      data: {
        nombre_archivo: file.originalname,
        ruta_archivo: file.filename,
        tipo_archivo: file.mimetype,
        fecha_carga: new Date(),
      },
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
    const archivo = await this.findOne(id);
    const removed = await this.prisma.archivo_adjunto.delete({
      where: { id_archivo_adjunto: id },
    });
    // Los que vienen de /upload guardan el nombre generado (sin subcarpetas)
    // en ruta_archivo, así que también se puede borrar el archivo físico.
    // Los creados a mano vía CreateArchivoAdjuntoDto pueden traer cualquier
    // texto en ruta_archivo (no hay validación de formato) — se verifica
    // que el path resuelto siga dentro de uploads/ antes de borrar, para
    // no seguir un "../../lo-que-sea" hacia afuera de esa carpeta.
    const rutaResuelta = normalize(join(UPLOADS_DIR, archivo.ruta_archivo));
    if (rutaResuelta.startsWith(UPLOADS_DIR)) {
      await rm(rutaResuelta, { force: true }).catch(() => undefined);
    }
    return removed;
  }
}
