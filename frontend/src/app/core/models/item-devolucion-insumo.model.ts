import { Insumo } from './insumo.model';
import { Linea } from './linea.model';

export interface ItemDevolucionInsumo {
  id_item_devolucion_insumo: number;
  id_devolucion_insumos: number;
  id_insumo: number;
  id_lineas: number;
  cantidad: number;
  insumo?: Insumo;
  lineas?: Linea;
}
