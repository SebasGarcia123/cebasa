import { Cliente } from './cliente.model';
import { Estado } from './estado.model';
import { Sector } from './sector.model';

export interface Reclamo {
  id_reclamo: number;
  fecha: string;
  descripcion: string | null;
  solucion: string | null;
  motivo_rechazo: string | null;
  id_cliente: number;
  id_estado: number;
  id_usuario: number;
  id_sector: number;
  clientes?: Cliente;
  estados?: Estado;
  sectores?: Sector;
}
