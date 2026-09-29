import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { CreateItemProdDto } from './dto/create-item-prod.dto.js';
import { UpdateItemProdDto } from './dto/update-item-prod.dto.js';

const ESTADOS_EDITABLES = new Set(['Pendiente', 'Rechazado']);

@Injectable()
export class ItemProdService {
  constructor(private readonly prisma: PrismaService) {}

  findAllForLote(idLote: number) {
    return this.prisma.item_prod.findMany({
      where: { id_lote: idLote },
      include: { productos: true, lineas: true },
    });
  }

  async create(idLote: number, dto: CreateItemProdDto) {
    await this.assertLoteEditable(idLote);
    return this.prisma.item_prod.create({
      data: { ...dto, id_lote: idLote },
      include: { productos: true, lineas: true },
    });
  }

  async findOne(idLote: number, idItem: number) {
    const item = await this.prisma.item_prod.findFirst({
      where: { id_item: idItem, id_lote: idLote },
      include: { productos: true, lineas: true },
    });
    if (!item) {
      throw new NotFoundException(
        `Item ${idItem} no encontrado en el lote ${idLote}`,
      );
    }
    return item;
  }

  async update(idLote: number, idItem: number, dto: UpdateItemProdDto) {
    await this.assertLoteEditable(idLote);
    await this.findOne(idLote, idItem);
    return this.prisma.item_prod.update({
      where: { id_item: idItem },
      data: dto,
    });
  }

  async remove(idLote: number, idItem: number) {
    await this.assertLoteEditable(idLote);
    await this.findOne(idLote, idItem);
    return this.prisma.item_prod.delete({ where: { id_item: idItem } });
  }

  // Editable mientras está abierto (Pendiente) o Rechazado. Una vez
  // cerrado (Pendiente de aprobación) queda en manos de Logística, y
  // aprobado ya sumó el stock: modificar los ítems después lo dejaría
  // desalineado con lo que dice el lote.
  private async assertLoteEditable(idLote: number): Promise<void> {
    const lote = await this.prisma.lote_prod.findUnique({
      where: { id_lote: idLote },
      include: { estados: true },
    });
    if (!lote) {
      throw new NotFoundException(`Lote de producción ${idLote} no encontrado`);
    }
    if (!ESTADOS_EDITABLES.has(lote.estados.nombreEstado)) {
      throw new BadRequestException('Los ítems solo se pueden modificar mientras el lote está abierto o rechazado');
    }
  }
}
