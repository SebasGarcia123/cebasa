import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreateTurnoDto } from './dto/create-turno.dto.js';
import { UpdateTurnoDto } from './dto/update-turno.dto.js';

@Injectable()
export class TurnosService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateTurnoDto) {
    return this.prisma.turnos.create({ data: dto });
  }

  findAll() {
    return this.prisma.turnos.findMany();
  }

  async findOne(id: number) {
    const turno = await this.prisma.turnos.findUnique({ where: { id_turno: id } });
    if (!turno) {
      throw new NotFoundException(`Turno ${id} no encontrado`);
    }
    return turno;
  }

  async update(id: number, dto: UpdateTurnoDto) {
    await this.findOne(id);
    return this.prisma.turnos.update({ where: { id_turno: id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.turnos.delete({ where: { id_turno: id } });
  }
}
