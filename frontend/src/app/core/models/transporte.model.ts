import { Estado } from './estado.model';
import { Direccion } from './direccion.model';
import { Camion } from './camion.model';
import { Chofer } from './chofer.model';

export interface Transporte {
  id_transporte: number;
  nombre_transporte: string;
  cuit: string;
  nombre_contacto: string | null;
  id_direccion: number;
  telefono: string | null;
  cbu_cuenta_bancaria: string | null;
  alias_cuenta_bancaria: string | null;
  id_estado: number;
  direcciones?: Direccion;
  estados?: Estado;
  camion?: Camion[];
  chofer?: Chofer[];
}
