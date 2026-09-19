import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { CreateItemPlanProduccionDto } from './dto/create-item-plan-produccion.dto.js';
import { UpdateItemPlanProduccionDto } from './dto/update-item-plan-produccion.dto.js';

@Injectable()
export class ItemPlanProduccionService {
  constructor(private readonly prisma: PrismaService) {}

  findAllForPlan(idPlan: number) {
    return this.prisma.item_plan_produccion.findMany({
      where: { id_plan_produccion: idPlan },
      include: { productos: true, lineas: true, turnos: true },
    });
  }

  create(idPlan: number, dto: CreateItemPlanProduccionDto) {
    return this.prisma.item_plan_produccion.create({
      data: { ...dto, id_plan_produccion: idPlan, fecha: new Date(dto.fecha) },
      include: { productos: true, lineas: true, turnos: true },
    });
  }

  async findOne(idPlan: number, idItem: number) {
    const item = await this.prisma.item_plan_produccion.findFirst({
      where: { id_item_plan_produccion: idItem, id_plan_produccion: idPlan },
      include: { productos: true, lineas: true, turnos: true },
    });
    if (!item) {
      throw new NotFoundException(
        `Item ${idItem} no encontrado en el plan de producción ${idPlan}`,
      );
    }
    return item;
  }

  async update(
    idPlan: number,
    idItem: number,
    dto: UpdateItemPlanProduccionDto,
  ) {
    await this.findOne(idPlan, idItem);
    return this.prisma.item_plan_produccion.update({
      where: { id_item_plan_produccion: idItem },
      data: {
        ...dto,
        fecha: dto.fecha ? new Date(dto.fecha) : undefined,
      },
    });
  }

  async remove(idPlan: number, idItem: number) {
    await this.findOne(idPlan, idItem);
    return this.prisma.item_plan_produccion.delete({
      where: { id_item_plan_produccion: idItem },
    });
  }
}
