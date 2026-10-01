import { Estado } from './estado.model';
import { Usuario } from './usuario.model';
import { ItemDevolucionInsumo } from './item-devolucion-insumo.model';

export interface DevolucionInsumos {
  id_devolucion_insumos: number;
  id_usuario: number;
  fecha_carga: string;
  id_estado: number;
  motivo_rechazo: string | null;
  usuarios?: Usuario;
  estados?: Estado;
  item_devolucion_insumo?: ItemDevolucionInsumo[];
}
