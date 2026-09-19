import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreateControlAutoelevadorDto } from './dto/create-control.dto.js';
import { UpdateControlAutoelevadorDto } from './dto/update-control.dto.js';

@Injectable()
export class ControlesAutoelevadorService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateControlAutoelevadorDto) {
    return this.prisma.control_autoelevador.create({
      data: { ...dto, fecha: new Date(dto.fecha) },
    });
  }

  findAll() {
    return this.prisma.control_autoelevador.findMany({
      include: { usuarios: true, autoelevadores: true },
    });
  }

  async findOne(id: number) {
    const control = await this.prisma.control_autoelevador.findUnique({
      where: { id_control_autoelevador: id },
      include: {
        usuarios: true,
        autoelevadores: true,
        item_control_autoelevador: true,
      },
    });
    if (!control) {
      throw new NotFoundException(
        `Control de autoelevador ${id} no encontrado`,
      );
    }
    return control;
  }

  async update(id: number, dto: UpdateControlAutoelevadorDto) {
    await this.findOne(id);
    return this.prisma.control_autoelevador.update({
      where: { id_control_autoelevador: id },
      data: {
        ...dto,
        fecha: dto.fecha ? new Date(dto.fecha) : undefined,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.control_autoelevador.delete({
      where: { id_control_autoelevador: id },
    });
  }
}
