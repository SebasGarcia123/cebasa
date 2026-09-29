import { Injectable } from '@nestjs/common';
import type { Planta } from '../generated/prisma/client.js';

export type { Planta };

// Baradero y Caseros son las dos plantas de la empresa. La planta de
// un sector o un depósito vive en su propia columna (enum Planta, ver
// schema.prisma) — no se infiere del nombre visible, que es solo el
// rótulo que puede editar cualquiera desde el ABM correspondiente sin
// que se rompa nada acá.
@Injectable()
export class PlantaLookupService {
  plantaDeSector(sector: { planta: Planta | null }): Planta | null {
    return sector.planta;
  }

  plantaDeDeposito(deposito: { planta: Planta | null }): Planta | null {
    return deposito.planta;
  }
}
