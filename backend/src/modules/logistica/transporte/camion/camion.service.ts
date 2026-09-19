import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { CreateCamionDto } from './dto/create-camion.dto.js';
import { UpdateCamionDto } from './dto/update-camion.dto.js';

@Injectable()
export class CamionService {
  constructor(private readonly prisma: PrismaService) {}

  findAllForTransporte(idTransporte: number) {
    return this.prisma.camion.findMany({
      where: { id_transporte: idTransporte },
    });
  }

  create(idTransporte: number, dto: CreateCamionDto) {
    return this.prisma.camion.create({
      data: { ...dto, id_transporte: idTransporte },
    });
  }

  async findOne(idTransporte: number, idCamion: number) {
    const camion = await this.prisma.camion.findFirst({
      where: { id_camion: idCamion, id_transporte: idTransporte },
    });
    if (!camion) {
      throw new NotFoundException(
        `Camión ${idCamion} no encontrado en el transporte ${idTransporte}`,
      );
    }
    return camion;
  }

  async update(idTransporte: number, idCamion: number, dto: UpdateCamionDto) {
    await this.findOne(idTransporte, idCamion);
    return this.prisma.camion.update({
      where: { id_camion: idCamion },
      data: dto,
    });
  }

  async remove(idTransporte: number, idCamion: number) {
    await this.findOne(idTransporte, idCamion);
    return this.prisma.camion.delete({ where: { id_camion: idCamion } });
  }
}
