import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AjustarStockDto } from './dto/ajustar-stock.dto.js';

@Injectable()
export class StockService {
  constructor(private readonly prisma: PrismaService) {}

  findInsumos() {
    return this.prisma.insumo.findMany({
      where: { stockeable: true },
      select: {
        id_insumo: true,
        codigo_insumo: true,
        nombre_insumo: true,
        stock_actual: true,
        stock_minimo: true,
      },
      orderBy: { nombre_insumo: 'asc' },
    });
  }

  findProductos() {
    return this.prisma.productos.findMany({
      select: {
        id_producto: true,
        codigo_producto: true,
        descripcion_producto: true,
        stock_actual: true,
        stock_minimo: true,
      },
      orderBy: { descripcion_producto: 'asc' },
    });
  }

  async ajustarInsumo(id: number, dto: AjustarStockDto, idUsuario: number) {
    const insumo = await this.prisma.insumo.findUnique({ where: { id_insumo: id } });
    if (!insumo) {
      throw new NotFoundException(`Insumo ${id} no encontrado`);
    }
    if (!insumo.stockeable) {
      throw new BadRequestException('Este insumo no es stockeable, no se le puede ajustar el stock');
    }

    const [, actualizado] = await this.prisma.$transaction([
      this.prisma.ajuste_stock.create({
        data: {
          id_insumo: id,
          id_usuario: idUsuario,
          cantidad_anterior: insumo.stock_actual,
          cantidad_nueva: dto.cantidad_nueva,
          motivo: dto.motivo,
        },
      }),
      this.prisma.insumo.update({
        where: { id_insumo: id },
        data: { stock_actual: dto.cantidad_nueva },
      }),
    ]);

    return actualizado;
  }

  async ajustarProducto(id: number, dto: AjustarStockDto, idUsuario: number) {
    const producto = await this.prisma.productos.findUnique({ where: { id_producto: id } });
    if (!producto) {
      throw new NotFoundException(`Producto ${id} no encontrado`);
    }

    const [, actualizado] = await this.prisma.$transaction([
      this.prisma.ajuste_stock.create({
        data: {
          id_producto: id,
          id_usuario: idUsuario,
          cantidad_anterior: producto.stock_actual,
          cantidad_nueva: dto.cantidad_nueva,
          motivo: dto.motivo,
        },
      }),
      this.prisma.productos.update({
        where: { id_producto: id },
        data: { stock_actual: dto.cantidad_nueva },
      }),
    ]);

    return actualizado;
  }
}
