import { Estado } from './estado.model';

export interface Fletero {
  id_fletero: number;
  nombre_fletero: string;
  cuit: string | null;
  telefono: string | null;
  id_estado: number;
  estados?: Estado;
}
