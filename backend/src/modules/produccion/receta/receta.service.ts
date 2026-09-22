import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { EstadosLookupService } from '../../../prisma/estados-lookup.service.js';
import { CreateRecetaDto } from './dto/create-receta.dto.js';
import { UpdateRecetaDto } from './dto/update-receta.dto.js';

const ESTADO_ACTIVO = 'Activo';
const ESTADOS_PERMITIDOS = new Set(['Activo', 'Anulado']);

@Injectable()
export class RecetaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly estadosLookup: EstadosLookupService,
  ) {}

  async create(dto: CreateRecetaDto) {
    const idEstadoActivo = await this.estadosLookup.getId(ESTADO_ACTIVO);
    return this.prisma.receta.create({ data: { ...dto, id_estado: idEstadoActivo } });
  }

  findAll() {
    return this.prisma.receta.findMany({
      include: { productos: true, estados: true },
    });
  }

  async findOne(id: number) {
    const receta = await this.prisma.receta.findUnique({
      where: { id_receta: id },
      include: {
        productos: true,
        estados: true,
        receta_item: { include: { insumo: true } },
      },
    });
    if (!receta) {
      throw new NotFoundException(`Receta ${id} no encontrada`);
    }
    return receta;
  }

  async update(id: number, dto: UpdateRecetaDto) {
    await this.findOne(id);

    if (dto.id_estado !== undefined) {
      const estado = await this.prisma.estados.findUnique({
        where: { id_estado: dto.id_estado },
      });
      if (!estado || !ESTADOS_PERMITIDOS.has(estado.nombreEstado)) {
        throw new BadRequestException('Una receta solo puede estar Activo o Anulado');
      }
    }

    return this.prisma.receta.update({ where: { id_receta: id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.receta.delete({ where: { id_receta: id } });
  }
}
