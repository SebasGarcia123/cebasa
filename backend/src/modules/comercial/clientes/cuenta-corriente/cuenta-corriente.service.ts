import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { CreateCuentaCorrienteDto } from './dto/create-cuenta-corriente.dto.js';
import { UpdateCuentaCorrienteDto } from './dto/update-cuenta-corriente.dto.js';

@Injectable()
export class CuentaCorrienteService {
  constructor(private readonly prisma: PrismaService) {}

  async create(idCliente: number, dto: CreateCuentaCorrienteDto) {
    const existente = await this.prisma.cuenta_corriente.findUnique({
      where: { id_cliente: idCliente },
    });
    if (existente) {
      throw new ConflictException(
        `El cliente ${idCliente} ya tiene una cuenta corriente`,
      );
    }
    return this.prisma.cuenta_corriente.create({
      data: { id_cliente: idCliente, limite_credito: dto.limite_credito ?? 0 },
    });
  }

  async findByCliente(idCliente: number) {
    const cuenta = await this.prisma.cuenta_corriente.findUnique({
      where: { id_cliente: idCliente },
    });
    if (!cuenta) {
      throw new NotFoundException(
        `El cliente ${idCliente} no tiene cuenta corriente`,
      );
    }
    return cuenta;
  }

  async update(idCliente: number, dto: UpdateCuentaCorrienteDto) {
    await this.findByCliente(idCliente);
    return this.prisma.cuenta_corriente.update({
      where: { id_cliente: idCliente },
      data: dto,
    });
  }

  async remove(idCliente: number) {
    await this.findByCliente(idCliente);
    return this.prisma.cuenta_corriente.delete({
      where: { id_cliente: idCliente },
    });
  }
}
