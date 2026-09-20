import { Insumo } from './insumo.model';

export interface RequerimientoDetalle {
  id_requerimiento_detalle: number;
  id_requerimiento: number;
  id_insumo: number;
  cantidad: number;
  insumo?: Insumo;
}
