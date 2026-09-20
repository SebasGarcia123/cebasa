import { Estado } from './estado.model';
import { Direccion } from './direccion.model';

export interface Chofer {
  id_chofer: number;
  nombre_chofer: string;
  dni: string;
  id_direccion: number;
  id_transporte: number;
  id_estado: number;
  direcciones?: Direccion;
  estados?: Estado;
}
