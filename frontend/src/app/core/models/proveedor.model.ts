import { Estado } from './estado.model';

export interface Proveedor {
  id_proveedor: number;
  nombre_proveedor: string;
  direccion: string | null;
  email: string | null;
  nombre_contacto: string | null;
  telefono: string | null;
  cbu: string | null;
  alias: string | null;
  id_estado: number;
  estados?: Estado;
}
