import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { EstadosLookupService } from '../../../prisma/estados-lookup.service.js';
import { CreatePedidoDto } from './dto/create-pedido.dto.js';
import { UpdatePedidoDto } from './dto/update-pedido.dto.js';

const ESTADO_ACTIVO = 'Activo';
const ESTADOS_PERMITIDOS = new Set(['Activo', 'Anulado']);

@Injectable()
export class PedidosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly estadosLookup: EstadosLookupService,
  ) {}

  // Un cliente cancelado no puede recibir pedidos nuevos.
  private async assertClienteActivo(idCliente: number): Promise<void> {
    const cliente = await this.prisma.clientes.findUnique({
      where: { id_cliente: idCliente },
      include: { estados: true },
    });
    if (cliente?.estados.nombreEstado === 'Cancelado') {
      throw new BadRequestException('No se pueden cargar pedidos a un cliente cancelado');
    }
  }

  async create(dto: CreatePedidoDto) {
    await this.assertClienteActivo(dto.id_cliente);
    const idEstadoActivo = await this.estadosLookup.getId(ESTADO_ACTIVO);
    return this.prisma.pedidos.create({
      data: {
        ...dto,
        id_estado: idEstadoActivo,
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
    if (dto.id_cliente !== undefined) {
      await this.assertClienteActivo(dto.id_cliente);
    }
    if (dto.id_estado !== undefined) {
      const estado = await this.prisma.estados.findUnique({
        where: { id_estado: dto.id_estado },
      });
      if (!estado || !ESTADOS_PERMITIDOS.has(estado.nombreEstado)) {
        throw new BadRequestException('Un pedido solo puede estar Activo o Anulado');
      }
    }
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
