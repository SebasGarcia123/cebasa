import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreateProductoDto } from './dto/create-producto.dto.js';
import { UpdateProductoDto } from './dto/update-producto.dto.js';

@Injectable()
export class ProductosService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateProductoDto) {
    return this.prisma.productos.create({ data: dto });
  }

  findAll() {
    return this.prisma.productos.findMany({ include: { estados: true, archivo_adjunto: true } });
  }

  async findOne(id: number) {
    const producto = await this.prisma.productos.findUnique({
      where: { id_producto: id },
      include: { estados: true, archivo_adjunto: true },
    });
    if (!producto) {
      throw new NotFoundException(`Producto ${id} no encontrado`);
    }
    return producto;
  }

  async update(id: number, dto: UpdateProductoDto) {
    await this.findOne(id);
    return this.prisma.productos.update({
      where: { id_producto: id },
      data: dto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.productos.delete({ where: { id_producto: id } });
  }
}
