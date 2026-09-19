import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreateDepositoDto } from './dto/create-deposito.dto.js';
import { UpdateDepositoDto } from './dto/update-deposito.dto.js';

@Injectable()
export class DepositoService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateDepositoDto) {
    return this.prisma.deposito.create({ data: dto });
  }

  findAll() {
    return this.prisma.deposito.findMany({ include: { estados: true } });
  }

  async findOne(id: number) {
    const deposito = await this.prisma.deposito.findUnique({
      where: { id_deposito: id },
      include: { estados: true },
    });
    if (!deposito) {
      throw new NotFoundException(`Depósito ${id} no encontrado`);
    }
    return deposito;
  }

  async update(id: number, dto: UpdateDepositoDto) {
    await this.findOne(id);
    return this.prisma.deposito.update({
      where: { id_deposito: id },
      data: dto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.deposito.delete({ where: { id_deposito: id } });
  }
}
