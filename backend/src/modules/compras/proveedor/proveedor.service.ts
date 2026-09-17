import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreateProveedorDto } from './dto/create-proveedor.dto.js';
import { UpdateProveedorDto } from './dto/update-proveedor.dto.js';

@Injectable()
export class ProveedorService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateProveedorDto) {
    return this.prisma.proveedor.create({ data: dto });
  }

  findAll() {
    return this.prisma.proveedor.findMany({ include: { estados: true } });
  }

  async findOne(id: number) {
    const proveedor = await this.prisma.proveedor.findUnique({
      where: { id_proveedor: id },
      include: { estados: true },
    });
    if (!proveedor) {
      throw new NotFoundException(`Proveedor ${id} no encontrado`);
    }
    return proveedor;
  }

  async update(id: number, dto: UpdateProveedorDto) {
    await this.findOne(id);
    return this.prisma.proveedor.update({ where: { id_proveedor: id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.proveedor.delete({ where: { id_proveedor: id } });
  }
}
