import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { CreateItemProdDto } from './dto/create-item-prod.dto.js';
import { UpdateItemProdDto } from './dto/update-item-prod.dto.js';

const ESTADO_APROBADO = 'Aprobado';

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

  // El stock ya se sumó cuando Logística aprobó el lote: modificar sus
  // ítems después dejaría el stock desalineado con lo que dice el lote.
  private async assertLoteEditable(idLote: number): Promise<void> {
    const lote = await this.prisma.lote_prod.findUnique({
      where: { id_lote: idLote },
      include: { estados: true },
    });
    if (!lote) {
      throw new NotFoundException(`Lote de producción ${idLote} no encontrado`);
    }
    if (lote.estados.nombreEstado === ESTADO_APROBADO) {
      throw new BadRequestException('No se pueden modificar los ítems de un lote de producción ya aprobado');
    }
  }
}
