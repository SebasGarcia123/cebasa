import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreateTipoProductoDto } from './dto/create-tipo-producto.dto.js';
import { UpdateTipoProductoDto } from './dto/update-tipo-producto.dto.js';

@Injectable()
export class TipoProductoService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateTipoProductoDto) {
    return this.prisma.tipo_producto.create({ data: dto });
  }

  findAll() {
    return this.prisma.tipo_producto.findMany();
  }

  async findOne(id: number) {
    const tipoProducto = await this.prisma.tipo_producto.findUnique({
      where: { id_tipo_producto: id },
    });
    if (!tipoProducto) {
      throw new NotFoundException(`Tipo de producto ${id} no encontrado`);
    }
    return tipoProducto;
  }

  async update(id: number, dto: UpdateTipoProductoDto) {
    await this.findOne(id);
    return this.prisma.tipo_producto.update({
      where: { id_tipo_producto: id },
      data: dto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.tipo_producto.delete({ where: { id_tipo_producto: id } });
  }
}
