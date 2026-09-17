import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreateCompraDto } from './dto/create-compra.dto.js';
import { UpdateCompraDto } from './dto/update-compra.dto.js';

@Injectable()
export class CompraService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateCompraDto) {
    return this.prisma.compra.create({
      data: { ...dto, fecha_compra: new Date(dto.fecha_compra) },
    });
  }

  findAll() {
    return this.prisma.compra.findMany({
      include: { proveedor: true, estados: true, archivo_adjunto: true },
    });
  }

  async findOne(id: number) {
    const compra = await this.prisma.compra.findUnique({
      where: { id_compra: id },
      include: {
        proveedor: true,
        estados: true,
        archivo_adjunto: true,
        compra_detalle: { include: { insumo: true } },
      },
    });
    if (!compra) {
      throw new NotFoundException(`Compra ${id} no encontrada`);
    }
    return compra;
  }

  async update(id: number, dto: UpdateCompraDto) {
    await this.findOne(id);
    return this.prisma.compra.update({
      where: { id_compra: id },
      data: {
        ...dto,
        fecha_compra: dto.fecha_compra ? new Date(dto.fecha_compra) : undefined,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.compra.delete({ where: { id_compra: id } });
  }
}
