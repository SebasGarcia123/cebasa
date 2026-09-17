import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { CreateChoferDto } from './dto/create-chofer.dto.js';
import { UpdateChoferDto } from './dto/update-chofer.dto.js';

@Injectable()
export class ChoferService {
  constructor(private readonly prisma: PrismaService) {}

  findAllForTransporte(idTransporte: number) {
    return this.prisma.chofer.findMany({
      where: { id_transporte: idTransporte },
      include: { direcciones: true, estados: true },
    });
  }

  create(idTransporte: number, dto: CreateChoferDto) {
    return this.prisma.chofer.create({ data: { ...dto, id_transporte: idTransporte } });
  }

  async findOne(idTransporte: number, idChofer: number) {
    const chofer = await this.prisma.chofer.findFirst({
      where: { id_chofer: idChofer, id_transporte: idTransporte },
      include: { direcciones: true, estados: true },
    });
    if (!chofer) {
      throw new NotFoundException(`Chofer ${idChofer} no encontrado en el transporte ${idTransporte}`);
    }
    return chofer;
  }

  async update(idTransporte: number, idChofer: number, dto: UpdateChoferDto) {
    await this.findOne(idTransporte, idChofer);
    return this.prisma.chofer.update({ where: { id_chofer: idChofer }, data: dto });
  }

  async remove(idTransporte: number, idChofer: number) {
    await this.findOne(idTransporte, idChofer);
    return this.prisma.chofer.delete({ where: { id_chofer: idChofer } });
  }
}
