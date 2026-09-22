import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { EstadosLookupService } from '../../../prisma/estados-lookup.service.js';
import { CreateTransporteDto } from './dto/create-transporte.dto.js';
import { UpdateTransporteDto } from './dto/update-transporte.dto.js';

const ESTADO_ACTIVO = 'Activo';
const ESTADOS_PERMITIDOS = new Set(['Activo', 'Anulado']);

@Injectable()
export class TransporteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly estadosLookup: EstadosLookupService,
  ) {}

  async create(dto: CreateTransporteDto) {
    const idEstadoActivo = await this.estadosLookup.getId(ESTADO_ACTIVO);
    return this.prisma.transporte.create({ data: { ...dto, id_estado: idEstadoActivo } });
  }

  findAll() {
    return this.prisma.transporte.findMany({
      include: { direcciones: true, estados: true, camion: true, chofer: true },
    });
  }

  async findOne(id: number) {
    const transporte = await this.prisma.transporte.findUnique({
      where: { id_transporte: id },
      include: { direcciones: true, estados: true, camion: true, chofer: true },
    });
    if (!transporte) {
      throw new NotFoundException(`Transporte ${id} no encontrado`);
    }
    return transporte;
  }

  async update(id: number, dto: UpdateTransporteDto) {
    await this.findOne(id);

    if (dto.id_estado !== undefined) {
      const estado = await this.prisma.estados.findUnique({
        where: { id_estado: dto.id_estado },
      });
      if (!estado || !ESTADOS_PERMITIDOS.has(estado.nombreEstado)) {
        throw new BadRequestException('Un transporte solo puede estar Activo o Anulado');
      }
    }

    return this.prisma.transporte.update({
      where: { id_transporte: id },
      data: dto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.transporte.delete({ where: { id_transporte: id } });
  }
}
