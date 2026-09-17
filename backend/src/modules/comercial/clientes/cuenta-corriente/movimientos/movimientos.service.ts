import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../../prisma/prisma.service.js';
import { CreateMovimientoCuentaCorrienteDto } from './dto/create-movimiento.dto.js';
import { UpdateMovimientoCuentaCorrienteDto } from './dto/update-movimiento.dto.js';

@Injectable()
export class MovimientosCuentaCorrienteService {
  constructor(private readonly prisma: PrismaService) {}

  private async cuentaDeCliente(idCliente: number) {
    const cuenta = await this.prisma.cuenta_corriente.findUnique({
      where: { id_cliente: idCliente },
    });
    if (!cuenta) {
      throw new NotFoundException(`El cliente ${idCliente} no tiene cuenta corriente`);
    }
    return cuenta;
  }

  async findAll(idCliente: number) {
    const cuenta = await this.cuentaDeCliente(idCliente);
    return this.prisma.movimiento_cuenta_corriente.findMany({
      where: { id_cuenta_corriente: cuenta.id_cuenta_corriente },
      include: { tipo_documento: true },
    });
  }

  async create(idCliente: number, dto: CreateMovimientoCuentaCorrienteDto) {
    const cuenta = await this.cuentaDeCliente(idCliente);
    return this.prisma.movimiento_cuenta_corriente.create({
      data: {
        fecha: new Date(dto.fecha),
        monto: dto.monto,
        id_tipo_documento: dto.id_tipo_documento,
        saldo_resultante: dto.saldo_resultante,
        id_cuenta_corriente: cuenta.id_cuenta_corriente,
      },
    });
  }

  async findOne(idCliente: number, idMovimiento: number) {
    const cuenta = await this.cuentaDeCliente(idCliente);
    const movimiento = await this.prisma.movimiento_cuenta_corriente.findFirst({
      where: {
        id_movimiento_cta_cte: idMovimiento,
        id_cuenta_corriente: cuenta.id_cuenta_corriente,
      },
      include: { tipo_documento: true },
    });
    if (!movimiento) {
      throw new NotFoundException(
        `Movimiento ${idMovimiento} no encontrado en la cuenta corriente del cliente ${idCliente}`,
      );
    }
    return movimiento;
  }

  async update(idCliente: number, idMovimiento: number, dto: UpdateMovimientoCuentaCorrienteDto) {
    await this.findOne(idCliente, idMovimiento);
    return this.prisma.movimiento_cuenta_corriente.update({
      where: { id_movimiento_cta_cte: idMovimiento },
      data: {
        ...dto,
        fecha: dto.fecha ? new Date(dto.fecha) : undefined,
      },
    });
  }

  async remove(idCliente: number, idMovimiento: number) {
    await this.findOne(idCliente, idMovimiento);
    return this.prisma.movimiento_cuenta_corriente.delete({
      where: { id_movimiento_cta_cte: idMovimiento },
    });
  }
}
