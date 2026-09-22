import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { EstadosLookupService } from '../../../prisma/estados-lookup.service.js';
import { CreateAutoelevadorDto } from './dto/create-autoelevador.dto.js';
import { UpdateAutoelevadorDto } from './dto/update-autoelevador.dto.js';

const ESTADO_ACTIVO = 'Activo';
const ESTADOS_PERMITIDOS = new Set(['Activo', 'Anulado']);

@Injectable()
export class AutoelevadoresService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly estadosLookup: EstadosLookupService,
  ) {}

  async create(dto: CreateAutoelevadorDto) {
    const idEstadoActivo = await this.estadosLookup.getId(ESTADO_ACTIVO);
    return this.prisma.autoelevadores.create({
      data: { ...dto, id_estado: idEstadoActivo, fecha_alta: new Date(dto.fecha_alta) },
    });
  }

  findAll() {
    return this.prisma.autoelevadores.findMany({ include: { estados: true } });
  }

  async findOne(id: number) {
    const autoelevador = await this.prisma.autoelevadores.findUnique({
      where: { id_autoelevadores: id },
      include: { estados: true, service_autoelevador: true },
    });
    if (!autoelevador) {
      throw new NotFoundException(`Autoelevador ${id} no encontrado`);
    }
    return autoelevador;
  }

  async update(id: number, dto: UpdateAutoelevadorDto) {
    await this.findOne(id);

    if (dto.id_estado !== undefined) {
      const estado = await this.prisma.estados.findUnique({
        where: { id_estado: dto.id_estado },
      });
      if (!estado || !ESTADOS_PERMITIDOS.has(estado.nombreEstado)) {
        throw new BadRequestException('Un autoelevador solo puede estar Activo o Anulado');
      }
    }

    return this.prisma.autoelevadores.update({
      where: { id_autoelevadores: id },
      data: {
        ...dto,
        fecha_alta: dto.fecha_alta ? new Date(dto.fecha_alta) : undefined,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.autoelevadores.delete({
      where: { id_autoelevadores: id },
    });
  }
}
