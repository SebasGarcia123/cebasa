import { Estado } from './estado.model';
import { Naturaleza } from './naturaleza.model';

export interface TipoMovimiento {
  id_tipo_movimiento: number;
  nombre_movimiento: string;
  id_naturaleza: number;
  id_estado: number;
  naturaleza?: Naturaleza;
  estados?: Estado;
}
