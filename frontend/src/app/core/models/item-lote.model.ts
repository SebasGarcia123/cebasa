import { UnidadMedida } from './unidad-medida.model';

export interface ItemLote {
  id_item_lote: number;
  descripcion_item: string;
  id_unidad_medida: number;
  cantidad_item_lote: number;
  id_lote: number;
  unidad_medida?: UnidadMedida;
}
