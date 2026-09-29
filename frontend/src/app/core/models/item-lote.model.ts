import { Producto } from './producto.model';
import { Insumo } from './insumo.model';

export interface ItemLote {
  id_item_lote: number;
  id_lote: number;
  id_producto: number | null;
  id_insumo: number | null;
  cantidad: number;
  productos?: Producto | null;
  insumo?: Insumo | null;
}
