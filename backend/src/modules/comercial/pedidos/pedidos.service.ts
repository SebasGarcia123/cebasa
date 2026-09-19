import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreatePedidoDto } from './dto/create-pedido.dto.js';
import { UpdatePedidoDto } from './dto/update-pedido.dto.js';

@Injectable()
export class PedidosService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreatePedidoDto) {
    return this.prisma.pedidos.create({
      data: {
        ...dto,
        fecha_carga: new Date(dto.fecha_carga),
        fecha_prometido: dto.fecha_prometido
          ? new Date(dto.fecha_prometido)
          : undefined,
      },
    });
  }

  findAll() {
    return this.prisma.pedidos.findMany({
      include: { clientes: true, estados: true },
    });
  }

  async findOne(id: number) {
    const pedido = await this.prisma.pedidos.findUnique({
      where: { id_pedido: id },
      include: {
        clientes: true,
        estados: true,
        usuarios: true,
        item_pedido: { include: { productos: true } },
      },
    });
    if (!pedido) {
      throw new NotFoundException(`Pedido ${id} no encontrado`);
    }
    return pedido;
  }

  async update(id: number, dto: UpdatePedidoDto) {
    await this.findOne(id);
    return this.prisma.pedidos.update({
      where: { id_pedido: id },
      data: {
        ...dto,
        fecha_carga: dto.fecha_carga ? new Date(dto.fecha_carga) : undefined,
        fecha_prometido: dto.fecha_prometido
          ? new Date(dto.fecha_prometido)
          : undefined,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.pedidos.delete({ where: { id_pedido: id } });
  }
}
