import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { EstadosLookupService } from '../../../prisma/estados-lookup.service.js';
import { CreateProductoDto } from './dto/create-producto.dto.js';
import { UpdateProductoDto } from './dto/update-producto.dto.js';

const ESTADO_ACTIVO = 'Activo';
const ESTADOS_PERMITIDOS = new Set(['Activo', 'Anulado']);

@Injectable()
export class ProductosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly estadosLookup: EstadosLookupService,
  ) {}

  async create(dto: CreateProductoDto) {
    const idEstadoActivo = await this.estadosLookup.getId(ESTADO_ACTIVO);
    return this.prisma.productos.create({
      data: { ...dto, id_estado: idEstadoActivo },
    });
  }

  findAll() {
    return this.prisma.productos.findMany({
      include: { estados: true, archivo_adjunto: true, tipo_producto: true },
    });
  }

  async findOne(id: number) {
    const producto = await this.prisma.productos.findUnique({
      where: { id_producto: id },
      include: { estados: true, archivo_adjunto: true, tipo_producto: true },
    });
    if (!producto) {
      throw new NotFoundException(`Producto ${id} no encontrado`);
    }
    return producto;
  }

  async update(id: number, dto: UpdateProductoDto) {
    await this.findOne(id);

    if (dto.id_estado !== undefined) {
      const estado = await this.prisma.estados.findUnique({
        where: { id_estado: dto.id_estado },
      });
      if (!estado || !ESTADOS_PERMITIDOS.has(estado.nombreEstado)) {
        throw new BadRequestException('Un producto solo puede estar Activo o Anulado');
      }
    }

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
