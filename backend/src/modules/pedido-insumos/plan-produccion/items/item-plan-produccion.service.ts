import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { PlanProduccionService } from '../plan-produccion.service.js';
import { esDiaHabil, esEditable, lunesDe } from '../semana.util.js';
import { CreateItemPlanProduccionDto } from './dto/create-item-plan-produccion.dto.js';
import { UpdateItemPlanProduccionDto } from './dto/update-item-plan-produccion.dto.js';

const INCLUDE_ITEM = { productos: true, lineas: true, turnos: true } as const;

@Injectable()
export class ItemPlanProduccionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly planProduccionService: PlanProduccionService,
  ) {}

  private assertFechaCargable(fecha: Date): void {
    if (!esDiaHabil(fecha)) {
      throw new BadRequestException('El plan de producción solo se carga de lunes a viernes');
    }
    if (!esEditable(fecha)) {
      throw new BadRequestException('No se puede cargar plan de producción en un día ya pasado');
    }
  }

  async create(dto: CreateItemPlanProduccionDto, idUsuario: number) {
    const fecha = new Date(dto.fecha);
    this.assertFechaCargable(fecha);

    const noLaborable = await this.prisma.dia_no_laborable.findUnique({ where: { fecha } });
    if (noLaborable) {
      throw new BadRequestException(`Ese día está marcado como no laborable (${noLaborable.motivo}), no se puede cargar plan`);
    }

    const plan = await this.planProduccionService.obtenerOCrearPlan(lunesDe(fecha), idUsuario);
    return this.prisma.item_plan_produccion.create({
      data: {
        id_plan_produccion: plan.id_plan_produccion,
        id_lineas: dto.id_lineas,
        id_producto: dto.id_producto,
        id_turno: dto.id_turno,
        cantidad: dto.cantidad,
        fecha,
      },
      include: INCLUDE_ITEM,
    });
  }

  private async findOne(idItem: number) {
    const item = await this.prisma.item_plan_produccion.findUnique({
      where: { id_item_plan_produccion: idItem },
      include: INCLUDE_ITEM,
    });
    if (!item) {
      throw new NotFoundException(`Ítem de plan de producción ${idItem} no encontrado`);
    }
    return item;
  }

  async update(idItem: number, dto: UpdateItemPlanProduccionDto) {
    const item = await this.findOne(idItem);
    if (!esEditable(item.fecha)) {
      throw new BadRequestException('No se puede editar un día ya pasado');
    }
    return this.prisma.item_plan_produccion.update({
      where: { id_item_plan_produccion: idItem },
      data: dto,
      include: INCLUDE_ITEM,
    });
  }

  async remove(idItem: number) {
    const item = await this.findOne(idItem);
    if (!esEditable(item.fecha)) {
      throw new BadRequestException('No se puede eliminar un día ya pasado');
    }
    return this.prisma.item_plan_produccion.delete({ where: { id_item_plan_produccion: idItem } });
  }
}
