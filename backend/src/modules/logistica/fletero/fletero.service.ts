import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { EstadosLookupService } from '../../../prisma/estados-lookup.service.js';
import { CreateFleteroDto } from './dto/create-fletero.dto.js';
import { UpdateFleteroDto } from './dto/update-fletero.dto.js';

const ESTADO_ACTIVO = 'Activo';
const ESTADOS_PERMITIDOS = new Set(['Activo', 'Anulado']);

@Injectable()
export class FleteroService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly estadosLookup: EstadosLookupService,
  ) {}

  async create(dto: CreateFleteroDto) {
    const idEstadoActivo = await this.estadosLookup.getId(ESTADO_ACTIVO);
    return this.prisma.fletero.create({ data: { ...dto, id_estado: idEstadoActivo } });
  }

  findAll() {
    return this.prisma.fletero.findMany();
  }

  async findOne(id: number) {
    const fletero = await this.prisma.fletero.findUnique({
      where: { id_fletero: id },
    });
    if (!fletero) {
      throw new NotFoundException(`Fletero ${id} no encontrado`);
    }
    return fletero;
  }

  async update(id: number, dto: UpdateFleteroDto) {
    await this.findOne(id);

    if (dto.id_estado !== undefined) {
      const estado = await this.prisma.estados.findUnique({
        where: { id_estado: dto.id_estado },
      });
      if (!estado || !ESTADOS_PERMITIDOS.has(estado.nombreEstado)) {
        throw new BadRequestException('Un fletero solo puede estar Activo o Anulado');
      }
    }

    return this.prisma.fletero.update({ where: { id_fletero: id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.fletero.delete({ where: { id_fletero: id } });
  }
}
