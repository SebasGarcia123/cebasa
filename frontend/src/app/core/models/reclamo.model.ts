import { Cliente } from './cliente.model';
import { Estado } from './estado.model';

export interface Reclamo {
  id_reclamo: number;
  fecha: string;
  descripcion: string | null;
  id_cliente: number;
  id_estado: number;
  id_usuario: number;
  clientes?: Cliente;
  estados?: Estado;
}
