import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { CreateStockInsumoDepositoDto } from './dto/create-stock.dto.js';
import { UpdateStockInsumoDepositoDto } from './dto/update-stock.dto.js';

@Injectable()
export class StockInsumoDepositoService {
  constructor(private readonly prisma: PrismaService) {}

  findAllForInsumo(idInsumo: number) {
    return this.prisma.stock_insumo_deposito.findMany({
      where: { id_insumo: idInsumo },
      include: { deposito: true },
    });
  }

  async create(idInsumo: number, dto: CreateStockInsumoDepositoDto) {
    const existente = await this.prisma.stock_insumo_deposito.findUnique({
      where: {
        id_insumo_id_deposito: {
          id_insumo: idInsumo,
          id_deposito: dto.id_deposito,
        },
      },
    });
    if (existente) {
      throw new ConflictException(
        `El insumo ${idInsumo} ya tiene stock registrado en el depósito ${dto.id_deposito}`,
      );
    }
    return this.prisma.stock_insumo_deposito.create({
      data: {
        id_insumo: idInsumo,
        id_deposito: dto.id_deposito,
        cantidad: dto.cantidad ?? 0,
      },
    });
  }

  async findOne(idInsumo: number, idDeposito: number) {
    const stock = await this.prisma.stock_insumo_deposito.findUnique({
      where: {
        id_insumo_id_deposito: { id_insumo: idInsumo, id_deposito: idDeposito },
      },
      include: { deposito: true },
    });
    if (!stock) {
      throw new NotFoundException(
        `No hay stock registrado del insumo ${idInsumo} en el depósito ${idDeposito}`,
      );
    }
    return stock;
  }

  async update(
    idInsumo: number,
    idDeposito: number,
    dto: UpdateStockInsumoDepositoDto,
  ) {
    await this.findOne(idInsumo, idDeposito);
    return this.prisma.stock_insumo_deposito.update({
      where: {
        id_insumo_id_deposito: { id_insumo: idInsumo, id_deposito: idDeposito },
      },
      data: dto,
    });
  }

  async remove(idInsumo: number, idDeposito: number) {
    await this.findOne(idInsumo, idDeposito);
    return this.prisma.stock_insumo_deposito.delete({
      where: {
        id_insumo_id_deposito: { id_insumo: idInsumo, id_deposito: idDeposito },
      },
    });
  }
}
