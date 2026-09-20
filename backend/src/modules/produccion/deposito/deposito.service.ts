import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { EstadosLookupService } from '../../../prisma/estados-lookup.service.js';
import { CreateDepositoDto } from './dto/create-deposito.dto.js';
import { UpdateDepositoDto } from './dto/update-deposito.dto.js';

const ESTADO_ACTIVO = 'Activo';
const ESTADOS_PERMITIDOS = new Set(['Activo', 'Anulado']);

@Injectable()
export class DepositoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly estadosLookup: EstadosLookupService,
  ) {}

  async create(dto: CreateDepositoDto) {
    const idEstadoActivo = await this.estadosLookup.getId(ESTADO_ACTIVO);
    return this.prisma.deposito.create({
      data: { ...dto, id_estado: idEstadoActivo },
    });
  }

  findAll() {
    return this.prisma.deposito.findMany({ include: { estados: true } });
  }

  async findOne(id: number) {
    const deposito = await this.prisma.deposito.findUnique({
      where: { id_deposito: id },
      include: { estados: true },
    });
    if (!deposito) {
      throw new NotFoundException(`Depósito ${id} no encontrado`);
    }
    return deposito;
  }

  async update(id: number, dto: UpdateDepositoDto) {
    await this.findOne(id);

    if (dto.id_estado !== undefined) {
      const estado = await this.prisma.estados.findUnique({
        where: { id_estado: dto.id_estado },
      });
      if (!estado || !ESTADOS_PERMITIDOS.has(estado.nombreEstado)) {
        throw new BadRequestException('Un depósito solo puede estar Activo o Anulado');
      }
    }

    return this.prisma.deposito.update({
      where: { id_deposito: id },
      data: dto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.deposito.delete({ where: { id_deposito: id } });
  }
}
