import { Estado } from './estado.model';

export interface Deposito {
  id_deposito: number;
  nombre_deposito: string;
  id_estado: number;
  estados?: Estado;
}
