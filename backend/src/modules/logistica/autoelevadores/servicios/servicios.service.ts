import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { CreateServicioAutoelevadorDto } from './dto/create-servicio.dto.js';
import { UpdateServicioAutoelevadorDto } from './dto/update-servicio.dto.js';

@Injectable()
export class ServiciosAutoelevadorService {
  constructor(private readonly prisma: PrismaService) {}

  findAllForAutoelevador(idAutoelevador: number) {
    return this.prisma.service_autoelevador.findMany({
      where: { id_autoelevador: idAutoelevador },
    });
  }

  create(idAutoelevador: number, dto: CreateServicioAutoelevadorDto) {
    return this.prisma.service_autoelevador.create({
      data: { ...dto, id_autoelevador: idAutoelevador },
    });
  }

  async findOne(idAutoelevador: number, idServicio: number) {
    const servicio = await this.prisma.service_autoelevador.findFirst({
      where: {
        id_service_autoelevador: idServicio,
        id_autoelevador: idAutoelevador,
      },
    });
    if (!servicio) {
      throw new NotFoundException(
        `Servicio ${idServicio} no encontrado en el autoelevador ${idAutoelevador}`,
      );
    }
    return servicio;
  }

  async update(
    idAutoelevador: number,
    idServicio: number,
    dto: UpdateServicioAutoelevadorDto,
  ) {
    await this.findOne(idAutoelevador, idServicio);
    return this.prisma.service_autoelevador.update({
      where: { id_service_autoelevador: idServicio },
      data: dto,
    });
  }

  async remove(idAutoelevador: number, idServicio: number) {
    await this.findOne(idAutoelevador, idServicio);
    return this.prisma.service_autoelevador.delete({
      where: { id_service_autoelevador: idServicio },
    });
  }
}
