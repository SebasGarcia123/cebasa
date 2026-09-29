import { Estado } from './estado.model';

export type Planta = 'CASEROS' | 'BARADERO';
export type RolDeposito = 'LOGISTICA' | 'PRODUCCION';

export interface Deposito {
  id_deposito: number;
  nombre_deposito: string;
  id_estado: number;
  // A qué planta pertenece y si es de logística o de producción — se
  // usa para filtrar pantallas por planta en vez de parsear
  // nombre_deposito (que es solo el rótulo, editable sin que se rompa
  // nada acá).
  planta: Planta | null;
  rol_deposito: RolDeposito | null;
  estados?: Estado;
}
