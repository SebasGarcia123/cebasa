import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { CreateCompraDetalleDto } from './dto/create-compra-detalle.dto.js';
import { UpdateCompraDetalleDto } from './dto/update-compra-detalle.dto.js';

@Injectable()
export class CompraDetalleService {
  constructor(private readonly prisma: PrismaService) {}

  findAllForCompra(idCompra: number) {
    return this.prisma.compra_detalle.findMany({
      where: { id_compra: idCompra },
      include: { insumo: true, requerimiento_detalle: true },
    });
  }

  create(idCompra: number, dto: CreateCompraDetalleDto) {
    return this.prisma.compra_detalle.create({
      data: { ...dto, id_compra: idCompra },
      include: { insumo: true, requerimiento_detalle: true },
    });
  }

  async findOne(idCompra: number, idDetalle: number) {
    const detalle = await this.prisma.compra_detalle.findFirst({
      where: { id_compra_detalle: idDetalle, id_compra: idCompra },
      include: { insumo: true, requerimiento_detalle: true },
    });
    if (!detalle) {
      throw new NotFoundException(`Detalle ${idDetalle} no encontrado en la compra ${idCompra}`);
    }
    return detalle;
  }

  async update(idCompra: number, idDetalle: number, dto: UpdateCompraDetalleDto) {
    await this.findOne(idCompra, idDetalle);
    return this.prisma.compra_detalle.update({
      where: { id_compra_detalle: idDetalle },
      data: dto,
    });
  }

  async remove(idCompra: number, idDetalle: number) {
    await this.findOne(idCompra, idDetalle);
    return this.prisma.compra_detalle.delete({ where: { id_compra_detalle: idDetalle } });
  }
}
