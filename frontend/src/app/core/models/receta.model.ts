import { Estado } from './estado.model';
import { Producto } from './producto.model';
import { RecetaItem } from './receta-item.model';

export interface Receta {
  id_receta: number;
  id_producto: number;
  id_estado: number;
  productos?: Producto;
  estados?: Estado;
  receta_item?: RecetaItem[];
}
