import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { EstadosLookupService } from '../../../prisma/estados-lookup.service.js';
import { CreateReclamoDto } from './dto/create-reclamo.dto.js';
import { ResolverReclamoDto } from './dto/resolver-reclamo.dto.js';
import { RechazarReclamoDto } from './dto/rechazar-reclamo.dto.js';

const ESTADO_ACTIVO = 'Activo';
const ESTADO_RESUELTO = 'Resuelto';
const ESTADO_RECHAZADO = 'Rechazado';

@Injectable()
export class ReclamosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly estadosLookup: EstadosLookupService,
  ) {}

  async create(dto: CreateReclamoDto) {
    const idEstadoActivo = await this.estadosLookup.getId(ESTADO_ACTIVO);
    return this.prisma.reclamos.create({
      data: { ...dto, id_estado: idEstadoActivo, fecha: new Date(dto.fecha) },
    });
  }

  findAll() {
    return this.prisma.reclamos.findMany({
      include: { clientes: true, estados: true, sectores: true },
    });
  }

  async findOne(id: number) {
    const reclamo = await this.prisma.reclamos.findUnique({
      where: { id_reclamo: id },
      include: { clientes: true, estados: true, usuarios: true, sectores: true },
    });
    if (!reclamo) {
      throw new NotFoundException(`Reclamo ${id} no encontrado`);
    }
    return reclamo;
  }

  countPendientes() {
    return this.prisma.reclamos.count({
      where: { estados: { nombreEstado: ESTADO_ACTIVO } },
    });
  }

  // Un reclamo no se edita ni se elimina: solo se resuelve o se rechaza.
  async resolver(id: number, dto: ResolverReclamoDto) {
    await this.findOne(id);
    const idEstadoResuelto = await this.estadosLookup.getId(ESTADO_RESUELTO);
    return this.prisma.reclamos.update({
      where: { id_reclamo: id },
      data: {
        solucion: dto.solucion,
        id_estado: idEstadoResuelto,
        motivo_rechazo: null,
      },
    });
  }

  async rechazar(id: number, dto: RechazarReclamoDto) {
    await this.findOne(id);

    if (dto.tipo_rechazo === 'redireccion') {
      if (!dto.id_sector_nuevo) {
        throw new BadRequestException('Debe indicar el sector al que se reasigna el reclamo');
      }
      const idEstadoActivo = await this.estadosLookup.getId(ESTADO_ACTIVO);
      return this.prisma.reclamos.update({
        where: { id_reclamo: id },
        data: {
          motivo_rechazo: dto.motivo_rechazo,
          id_sector: dto.id_sector_nuevo,
          id_estado: idEstadoActivo,
          solucion: null,
        },
      });
    }

    const idEstadoRechazado = await this.estadosLookup.getId(ESTADO_RECHAZADO);
    return this.prisma.reclamos.update({
      where: { id_reclamo: id },
      data: {
        motivo_rechazo: dto.motivo_rechazo,
        id_estado: idEstadoRechazado,
        solucion: null,
      },
    });
  }
}
