import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { CreateItemControlDto } from './dto/create-item-control.dto.js';
import { UpdateItemControlDto } from './dto/update-item-control.dto.js';

@Injectable()
export class ItemControlService {
  constructor(private readonly prisma: PrismaService) {}

  findAllForControl(idControl: number) {
    return this.prisma.item_control_autoelevador.findMany({
      where: { id_control_autoelevador: idControl },
    });
  }

  create(idControl: number, dto: CreateItemControlDto) {
    return this.prisma.item_control_autoelevador.create({
      data: { ...dto, id_control_autoelevador: idControl },
    });
  }

  async findOne(idControl: number, idItem: number) {
    const item = await this.prisma.item_control_autoelevador.findFirst({
      where: { id_item_control: idItem, id_control_autoelevador: idControl },
    });
    if (!item) {
      throw new NotFoundException(
        `Item ${idItem} no encontrado en el control ${idControl}`,
      );
    }
    return item;
  }

  async update(idControl: number, idItem: number, dto: UpdateItemControlDto) {
    await this.findOne(idControl, idItem);
    return this.prisma.item_control_autoelevador.update({
      where: { id_item_control: idItem },
      data: dto,
    });
  }

  async remove(idControl: number, idItem: number) {
    await this.findOne(idControl, idItem);
    return this.prisma.item_control_autoelevador.delete({
      where: { id_item_control: idItem },
    });
  }
}
