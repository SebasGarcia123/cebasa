import { Injectable } from '@nestjs/common';

// Baradero y Caseros son las dos plantas de la empresa. No hay un
// campo dedicado para "planta" en sectores ni depósitos todavía: se
// infiere del nombre (ej. "Logística Caseros", "Producción Baradero"),
// igual que ya se hacía en PedidosService antes de esta extracción.
export type Planta = 'caseros' | 'baradero';

@Injectable()
export class PlantaLookupService {
  private extraerPlanta(nombre: string): Planta | null {
    const lower = nombre.toLowerCase();
    if (lower.includes('caseros')) return 'caseros';
    if (lower.includes('baradero')) return 'baradero';
    return null;
  }

  plantaDeSector(nombreSector: string): Planta | null {
    return this.extraerPlanta(nombreSector);
  }

  plantaDeDeposito(nombreDeposito: string): Planta | null {
    return this.extraerPlanta(nombreDeposito);
  }
}
