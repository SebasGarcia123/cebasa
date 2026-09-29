import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { CreateItemLoteDto } from './dto/create-item-lote.dto.js';
import { UpdateItemLoteDto } from './dto/update-item-lote.dto.js';

const ESTADOS_EDITABLES = new Set(['Pendiente', 'Rechazado']);
const INCLUDE_ITEM = { productos: true, insumo: true } as const;

@Injectable()
export class ItemLoteService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertLoteEditable(idLote: number): Promise<void> {
    const lote = await this.prisma.lotes.findUnique({ where: { id_lote: idLote }, include: { estados: true } });
    if (!lote) {
      throw new NotFoundException(`Lote ${idLote} no encontrado`);
    }
    if (!ESTADOS_EDITABLES.has(lote.estados.nombreEstado)) {
      throw new BadRequestException('Los ítems solo se pueden modificar mientras el lote está Pendiente o Rechazado');
    }
  }

  private assertExactamenteUno(dto: { id_producto?: number; id_insumo?: number }): void {
    const cantidad = [dto.id_producto, dto.id_insumo].filter((v) => v != null).length;
    if (cantidad !== 1) {
      throw new BadRequestException('El ítem tiene que tener exactamente un producto o un insumo, no ambos ni ninguno');
    }
  }

  findAllForLote(idLote: number) {
    return this.prisma.item_lote.findMany({ where: { id_lote: idLote }, include: INCLUDE_ITEM });
  }

  async create(idLote: number, dto: CreateItemLoteDto) {
    await this.assertLoteEditable(idLote);
    this.assertExactamenteUno(dto);
    return this.prisma.item_lote.create({ data: { ...dto, id_lote: idLote }, include: INCLUDE_ITEM });
  }

  async findOne(idLote: number, idItem: number) {
    const item = await this.prisma.item_lote.findFirst({
      where: { id_item_lote: idItem, id_lote: idLote },
      include: INCLUDE_ITEM,
    });
    if (!item) {
      throw new NotFoundException(`Item ${idItem} no encontrado en el lote ${idLote}`);
    }
    return item;
  }

  async update(idLote: number, idItem: number, dto: UpdateItemLoteDto) {
    await this.assertLoteEditable(idLote);
    const actual = await this.findOne(idLote, idItem);
    // Si el patch no toca id_producto/id_insumo, no hay nada que
    // revalidar (sigue lo que ya tenía). Si toca alguno de los dos, se
    // valida el resultado final combinado, no solo lo que llegó en el body.
    if (dto.id_producto !== undefined || dto.id_insumo !== undefined) {
      this.assertExactamenteUno({
        id_producto: dto.id_producto ?? actual.id_producto ?? undefined,
        id_insumo: dto.id_insumo ?? actual.id_insumo ?? undefined,
      });
    }
    return this.prisma.item_lote.update({ where: { id_item_lote: idItem }, data: dto, include: INCLUDE_ITEM });
  }

  async remove(idLote: number, idItem: number) {
    await this.assertLoteEditable(idLote);
    await this.findOne(idLote, idItem);
    return this.prisma.item_lote.delete({ where: { id_item_lote: idItem } });
  }
}
