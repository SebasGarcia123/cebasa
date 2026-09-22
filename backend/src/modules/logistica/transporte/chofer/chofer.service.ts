import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { EstadosLookupService } from '../../../../prisma/estados-lookup.service.js';
import { CreateChoferDto } from './dto/create-chofer.dto.js';
import { UpdateChoferDto } from './dto/update-chofer.dto.js';

const ESTADO_ACTIVO = 'Activo';
const ESTADOS_PERMITIDOS = new Set(['Activo', 'Anulado']);

@Injectable()
export class ChoferService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly estadosLookup: EstadosLookupService,
  ) {}

  findAllForTransporte(idTransporte: number) {
    return this.prisma.chofer.findMany({
      where: { id_transporte: idTransporte },
      include: { direcciones: true, estados: true },
    });
  }

  async create(idTransporte: number, dto: CreateChoferDto) {
    const idEstadoActivo = await this.estadosLookup.getId(ESTADO_ACTIVO);
    return this.prisma.chofer.create({
      data: { ...dto, id_transporte: idTransporte, id_estado: idEstadoActivo },
    });
  }

  async findOne(idTransporte: number, idChofer: number) {
    const chofer = await this.prisma.chofer.findFirst({
      where: { id_chofer: idChofer, id_transporte: idTransporte },
      include: { direcciones: true, estados: true },
    });
    if (!chofer) {
      throw new NotFoundException(
        `Chofer ${idChofer} no encontrado en el transporte ${idTransporte}`,
      );
    }
    return chofer;
  }

  async update(idTransporte: number, idChofer: number, dto: UpdateChoferDto) {
    await this.findOne(idTransporte, idChofer);

    if (dto.id_estado !== undefined) {
      const estado = await this.prisma.estados.findUnique({
        where: { id_estado: dto.id_estado },
      });
      if (!estado || !ESTADOS_PERMITIDOS.has(estado.nombreEstado)) {
        throw new BadRequestException('Un chofer solo puede estar Activo o Anulado');
      }
    }

    return this.prisma.chofer.update({
      where: { id_chofer: idChofer },
      data: dto,
    });
  }

  async remove(idTransporte: number, idChofer: number) {
    await this.findOne(idTransporte, idChofer);
    return this.prisma.chofer.delete({ where: { id_chofer: idChofer } });
  }
}
