import { Insumo } from './insumo.model';

export interface RecetaItem {
  id_receta_item: number;
  id_insumo: number;
  id_receta: number;
  cantidad_utilizada: number;
  insumo?: Insumo;
}
