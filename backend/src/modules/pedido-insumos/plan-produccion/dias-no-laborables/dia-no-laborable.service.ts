import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { PlanProduccionService } from '../plan-produccion.service.js';
import { esDiaHabil, esEditable, lunesDe } from '../semana.util.js';
import { CreateDiaNoLaborableDto } from './dto/create-dia-no-laborable.dto.js';

@Injectable()
export class DiaNoLaborableService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly planProduccionService: PlanProduccionService,
  ) {}

  async create(dto: CreateDiaNoLaborableDto, idUsuario: number) {
    const fecha = new Date(dto.fecha);
    if (!esDiaHabil(fecha)) {
      throw new BadRequestException('Solo se pueden marcar como no laborables días de lunes a viernes');
    }
    if (!esEditable(fecha)) {
      throw new BadRequestException('No se puede marcar como no laborable un día ya pasado');
    }

    const yaMarcado = await this.prisma.dia_no_laborable.findUnique({ where: { fecha } });
    if (yaMarcado) {
      throw new BadRequestException('Ese día ya está marcado como no laborable');
    }

    const hayItems = await this.prisma.item_plan_produccion.count({ where: { fecha } });
    if (hayItems > 0) {
      throw new BadRequestException('Ese día ya tiene plan de producción cargado; eliminalo antes de marcarlo como no laborable');
    }

    const plan = await this.planProduccionService.obtenerOCrearPlan(lunesDe(fecha), idUsuario);
    return this.prisma.dia_no_laborable.create({
      data: { id_plan_produccion: plan.id_plan_produccion, fecha, motivo: dto.motivo },
    });
  }

  async remove(id: number) {
    const dia = await this.prisma.dia_no_laborable.findUnique({ where: { id_dia_no_laborable: id } });
    if (!dia) {
      throw new NotFoundException(`Día no laborable ${id} no encontrado`);
    }
    if (!esEditable(dia.fecha)) {
      throw new BadRequestException('No se puede deshacer un día no laborable ya pasado');
    }
    return this.prisma.dia_no_laborable.delete({ where: { id_dia_no_laborable: id } });
  }
}
