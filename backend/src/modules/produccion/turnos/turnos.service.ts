import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { EstadosLookupService } from '../../../prisma/estados-lookup.service.js';
import { CreateTurnoDto } from './dto/create-turno.dto.js';
import { UpdateTurnoDto } from './dto/update-turno.dto.js';

const ESTADO_ACTIVO = 'Activo';
const ESTADOS_PERMITIDOS = new Set(['Activo', 'Anulado']);

@Injectable()
export class TurnosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly estadosLookup: EstadosLookupService,
  ) {}

  async create(dto: CreateTurnoDto) {
    const idEstadoActivo = await this.estadosLookup.getId(ESTADO_ACTIVO);
    return this.prisma.turnos.create({ data: { ...dto, id_estado: idEstadoActivo } });
  }

  findAll() {
    return this.prisma.turnos.findMany();
  }

  async findOne(id: number) {
    const turno = await this.prisma.turnos.findUnique({
      where: { id_turno: id },
    });
    if (!turno) {
      throw new NotFoundException(`Turno ${id} no encontrado`);
    }
    return turno;
  }

  async update(id: number, dto: UpdateTurnoDto) {
    await this.findOne(id);

    if (dto.id_estado !== undefined) {
      const estado = await this.prisma.estados.findUnique({
        where: { id_estado: dto.id_estado },
      });
      if (!estado || !ESTADOS_PERMITIDOS.has(estado.nombreEstado)) {
        throw new BadRequestException('Un turno solo puede estar Activo o Anulado');
      }
    }

    return this.prisma.turnos.update({ where: { id_turno: id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.turnos.delete({ where: { id_turno: id } });
  }
}
