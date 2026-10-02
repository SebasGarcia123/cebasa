import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { EstadosLookupService } from '../../../prisma/estados-lookup.service.js';
import { CreateClienteDto } from './dto/create-cliente.dto.js';
import { UpdateClienteDto } from './dto/update-cliente.dto.js';

const ESTADO_ACTIVO = 'Activo';
const ESTADOS_PERMITIDOS = new Set(['Activo', 'Cancelado']);

@Injectable()
export class ClientesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly estadosLookup: EstadosLookupService,
  ) {}

  async create(dto: CreateClienteDto) {
    const idEstadoActivo = await this.estadosLookup.getId(ESTADO_ACTIVO);
    return this.prisma.clientes.create({
      data: { ...dto, id_estado: idEstadoActivo },
    });
  }

  findAll() {
    return this.prisma.clientes.findMany({
      include: { direcciones: true, estados: true },
    });
  }

  async findOne(id: number) {
    const cliente = await this.prisma.clientes.findUnique({
      where: { id_cliente: id },
      include: { direcciones: true, estados: true, cuenta_corriente: true },
    });
    if (!cliente) {
      throw new NotFoundException(`Cliente ${id} no encontrado`);
    }
    return cliente;
  }

  // Pedidos del cliente para su pantalla de detalle. Trae los ítems en
  // la misma respuesta para que el "Ver" del detalle no tenga que pegar
  // contra /pedidos/:id, que exige el permiso de otra pantalla
  // (comercial.pedidos.ver) y dejaría el detalle a medias para quien
  // solo administra clientes.
  async pedidosDelCliente(id: number) {
    await this.findOne(id);
    return this.prisma.pedidos.findMany({
      where: { id_cliente: id },
      include: {
        estados: true,
        item_pedido: { include: { productos: { include: { tipo_producto: true } } } },
      },
      orderBy: { fecha_carga: 'desc' },
    });
  }

  async update(id: number, dto: UpdateClienteDto) {
    await this.findOne(id);

    if (dto.id_estado !== undefined) {
      const estado = await this.prisma.estados.findUnique({
        where: { id_estado: dto.id_estado },
      });
      if (!estado || !ESTADOS_PERMITIDOS.has(estado.nombreEstado)) {
        throw new BadRequestException('Un cliente solo puede estar Activo o Cancelado');
      }
    }

    return this.prisma.clientes.update({
      where: { id_cliente: id },
      data: dto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.clientes.delete({ where: { id_cliente: id } });
  }
}
