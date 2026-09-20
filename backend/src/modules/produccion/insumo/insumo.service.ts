import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { EstadosLookupService } from '../../../prisma/estados-lookup.service.js';
import { CreateInsumoDto } from './dto/create-insumo.dto.js';
import { UpdateInsumoDto } from './dto/update-insumo.dto.js';

const ESTADO_ACTIVO = 'Activo';
const ESTADOS_PERMITIDOS = new Set(['Activo', 'Anulado']);

@Injectable()
export class InsumoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly estadosLookup: EstadosLookupService,
  ) {}

  async create(dto: CreateInsumoDto) {
    const idEstadoActivo = await this.estadosLookup.getId(ESTADO_ACTIVO);
    return this.prisma.insumo.create({
      data: { ...dto, stock_actual: 0, id_estado: idEstadoActivo },
    });
  }

  findAll() {
    return this.prisma.insumo.findMany({
      include: { unidad_medida: true, estados: true },
    });
  }

  async findOne(id: number) {
    const insumo = await this.prisma.insumo.findUnique({
      where: { id_insumo: id },
      include: {
        unidad_medida: true,
        estados: true,
        stock_insumo_deposito: { include: { deposito: true } },
      },
    });
    if (!insumo) {
      throw new NotFoundException(`Insumo ${id} no encontrado`);
    }
    return insumo;
  }

  async update(id: number, dto: UpdateInsumoDto) {
    await this.findOne(id);

    if (dto.id_estado !== undefined) {
      const estado = await this.prisma.estados.findUnique({
        where: { id_estado: dto.id_estado },
      });
      if (!estado || !ESTADOS_PERMITIDOS.has(estado.nombreEstado)) {
        throw new BadRequestException('Un insumo solo puede estar Activo o Anulado');
      }
    }

    return this.prisma.insumo.update({ where: { id_insumo: id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.insumo.delete({ where: { id_insumo: id } });
  }
}
