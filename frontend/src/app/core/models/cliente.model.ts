import { Direccion } from './direccion.model';
import { Estado } from './estado.model';

export interface Cliente {
  id_cliente: number;
  nombre_cli: string;
  id_direccion: number;
  telefono_cli: string | null;
  email_cli: string | null;
  id_estado: number;
  direcciones?: Direccion;
  estados?: Estado;
}
