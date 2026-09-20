import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

// El catálogo `estados` es genérico y compartido por las 54 tablas del
// sistema; el id concreto de un nombre depende de qué se sembró en cada
// base, así que se resuelve por nombre en vez de hardcodearlo. Usado por
// cualquier entidad donde el sistema decide el estado en vez de que lo
// elija quien carga el registro (reclamos, clientes, etc.).
@Injectable()
export class EstadosLookupService {
  constructor(private readonly prisma: PrismaService) {}

  async getId(nombre: string): Promise<number> {
    const estado = await this.prisma.estados.findFirst({
      where: { nombreEstado: nombre },
    });
    if (!estado) {
      throw new BadRequestException(`No existe el estado "${nombre}" en el catálogo`);
    }
    return estado.id_estado;
  }
}
