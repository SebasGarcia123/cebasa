import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AjustarStockDto } from './dto/ajustar-stock.dto.js';

@Injectable()
export class StockService {
  constructor(private readonly prisma: PrismaService) {}

  // Sin idDeposito: stock total (cacheado en insumo.stock_actual, suma
  // de todos los depósitos). Con idDeposito: lo que hay puntualmente en
  // ese depósito (0 si el insumo todavía no tiene fila ahí).
  async findInsumos(idDeposito?: number) {
    const insumos = await this.prisma.insumo.findMany({
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
    if (!idDeposito) {
      return insumos;
    }

    const porDeposito = await this.prisma.stock_insumo_deposito.findMany({ where: { id_deposito: idDeposito } });
    const cantidadPorInsumo = new Map(porDeposito.map((s) => [s.id_insumo, s.cantidad]));
    return insumos.map((i) => ({ ...i, stock_actual: cantidadPorInsumo.get(i.id_insumo) ?? 0 }));
  }

  async findProductos(idDeposito?: number) {
    const productos = await this.prisma.productos.findMany({
      select: {
        id_producto: true,
        codigo_producto: true,
        descripcion_producto: true,
        stock_actual: true,
        stock_minimo: true,
      },
      orderBy: { descripcion_producto: 'asc' },
    });
    if (!idDeposito) {
      return productos;
    }

    const porDeposito = await this.prisma.stock_producto_deposito.findMany({ where: { id_deposito: idDeposito } });
    const cantidadPorProducto = new Map(porDeposito.map((s) => [s.id_producto, s.cantidad]));
    return productos.map((p) => ({ ...p, stock_actual: cantidadPorProducto.get(p.id_producto) ?? 0 }));
  }

  // cantidad_nueva del dto es el nuevo total EN dto.id_deposito, no el
  // global: se registra el ajuste con la cantidad anterior de ESE
  // depósito, se actualiza su fila, y el total cacheado se mueve por
  // la diferencia (delta), no se pisa con el valor absoluto.
  async ajustarInsumo(id: number, dto: AjustarStockDto, idUsuario: number) {
    const insumo = await this.prisma.insumo.findUnique({ where: { id_insumo: id } });
    if (!insumo) {
      throw new NotFoundException(`Insumo ${id} no encontrado`);
    }
    if (!insumo.stockeable) {
      throw new BadRequestException('Este insumo no es stockeable, no se le puede ajustar el stock');
    }

    const stockDeposito = await this.prisma.stock_insumo_deposito.findUnique({
      where: { id_insumo_id_deposito: { id_insumo: id, id_deposito: dto.id_deposito } },
    });
    const cantidadAnterior = stockDeposito?.cantidad ?? 0;
    const delta = dto.cantidad_nueva - cantidadAnterior;

    const [, , actualizado] = await this.prisma.$transaction([
      this.prisma.ajuste_stock.create({
        data: {
          id_insumo: id,
          id_usuario: idUsuario,
          id_deposito: dto.id_deposito,
          cantidad_anterior: cantidadAnterior,
          cantidad_nueva: dto.cantidad_nueva,
          motivo: dto.motivo,
        },
      }),
      this.prisma.stock_insumo_deposito.upsert({
        where: { id_insumo_id_deposito: { id_insumo: id, id_deposito: dto.id_deposito } },
        create: { id_insumo: id, id_deposito: dto.id_deposito, cantidad: dto.cantidad_nueva },
        update: { cantidad: dto.cantidad_nueva },
      }),
      this.prisma.insumo.update({
        where: { id_insumo: id },
        data: { stock_actual: { increment: delta } },
      }),
    ]);

    return actualizado;
  }

  async ajustarProducto(id: number, dto: AjustarStockDto, idUsuario: number) {
    const producto = await this.prisma.productos.findUnique({ where: { id_producto: id } });
    if (!producto) {
      throw new NotFoundException(`Producto ${id} no encontrado`);
    }

    const stockDeposito = await this.prisma.stock_producto_deposito.findUnique({
      where: { id_producto_id_deposito: { id_producto: id, id_deposito: dto.id_deposito } },
    });
    const cantidadAnterior = stockDeposito?.cantidad ?? 0;
    const delta = dto.cantidad_nueva - cantidadAnterior;

    const [, , actualizado] = await this.prisma.$transaction([
      this.prisma.ajuste_stock.create({
        data: {
          id_producto: id,
          id_usuario: idUsuario,
          id_deposito: dto.id_deposito,
          cantidad_anterior: cantidadAnterior,
          cantidad_nueva: dto.cantidad_nueva,
          motivo: dto.motivo,
        },
      }),
      this.prisma.stock_producto_deposito.upsert({
        where: { id_producto_id_deposito: { id_producto: id, id_deposito: dto.id_deposito } },
        create: { id_producto: id, id_deposito: dto.id_deposito, cantidad: dto.cantidad_nueva },
        update: { cantidad: dto.cantidad_nueva },
      }),
      this.prisma.productos.update({
        where: { id_producto: id },
        data: { stock_actual: { increment: delta } },
      }),
    ]);

    return actualizado;
  }
}
