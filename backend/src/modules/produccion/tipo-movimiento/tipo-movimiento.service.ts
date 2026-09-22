import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { EstadosLookupService } from '../../../prisma/estados-lookup.service.js';
import { CreateTipoMovimientoDto } from './dto/create-tipo-movimiento.dto.js';
import { UpdateTipoMovimientoDto } from './dto/update-tipo-movimiento.dto.js';

const ESTADO_ACTIVO = 'Activo';
const ESTADOS_PERMITIDOS = new Set(['Activo', 'Anulado']);

@Injectable()
export class TipoMovimientoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly estadosLookup: EstadosLookupService,
  ) {}

  async create(dto: CreateTipoMovimientoDto) {
    const idEstadoActivo = await this.estadosLookup.getId(ESTADO_ACTIVO);
    return this.prisma.tipo_movimiento.create({ data: { ...dto, id_estado: idEstadoActivo } });
  }

  findAll() {
    return this.prisma.tipo_movimiento.findMany({
      include: { naturaleza: true, estados: true },
    });
  }

  async findOne(id: number) {
    const tipoMovimiento = await this.prisma.tipo_movimiento.findUnique({
      where: { id_tipo_movimiento: id },
      include: { naturaleza: true, estados: true },
    });
    if (!tipoMovimiento) {
      throw new NotFoundException(`Tipo de movimiento ${id} no encontrado`);
    }
    return tipoMovimiento;
  }

  async update(id: number, dto: UpdateTipoMovimientoDto) {
    await this.findOne(id);

    if (dto.id_estado !== undefined) {
      const estado = await this.prisma.estados.findUnique({
        where: { id_estado: dto.id_estado },
      });
      if (!estado || !ESTADOS_PERMITIDOS.has(estado.nombreEstado)) {
        throw new BadRequestException('Un tipo de movimiento solo puede estar Activo o Anulado');
      }
    }

    return this.prisma.tipo_movimiento.update({
      where: { id_tipo_movimiento: id },
      data: dto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.tipo_movimiento.delete({
      where: { id_tipo_movimiento: id },
    });
  }
}
