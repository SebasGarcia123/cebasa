import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreatePedidoInsumosDto } from './dto/create-pedido-insumos.dto.js';
import { UpdatePedidoInsumosDto } from './dto/update-pedido-insumos.dto.js';

@Injectable()
export class PedidoInsumosService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreatePedidoInsumosDto) {
    return this.prisma.pedido_insumos.create({
      data: {
        ...dto,
        fecha_carga: new Date(dto.fecha_carga),
        fecha_necesidad: new Date(dto.fecha_necesidad),
      },
    });
  }

  findAll() {
    return this.prisma.pedido_insumos.findMany({ include: { usuarios: true, estados: true } });
  }

  async findOne(id: number) {
    const pedido = await this.prisma.pedido_insumos.findUnique({
      where: { id_pedido_insumos: id },
      include: {
        usuarios: true,
        estados: true,
        item_pedido_insumo: { include: { insumo: true } },
      },
    });
    if (!pedido) {
      throw new NotFoundException(`Pedido de insumos ${id} no encontrado`);
    }
    return pedido;
  }

  async update(id: number, dto: UpdatePedidoInsumosDto) {
    await this.findOne(id);
    return this.prisma.pedido_insumos.update({
      where: { id_pedido_insumos: id },
      data: {
        ...dto,
        fecha_carga: dto.fecha_carga ? new Date(dto.fecha_carga) : undefined,
        fecha_necesidad: dto.fecha_necesidad ? new Date(dto.fecha_necesidad) : undefined,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.pedido_insumos.delete({ where: { id_pedido_insumos: id } });
  }
}
