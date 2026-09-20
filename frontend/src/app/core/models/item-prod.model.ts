import { Producto } from './producto.model';
import { Linea } from './linea.model';

export interface ItemProd {
  id_item: number;
  id_producto: number;
  cantidad: number;
  id_lote: number;
  id_lineas: number;
  productos?: Producto;
  lineas?: Linea;
}
