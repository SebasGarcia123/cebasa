import { Insumo } from './insumo.model';
import { RequerimientoDetalle } from './requerimiento-detalle.model';

export interface CompraDetalle {
  id_compra_detalle: number;
  id_compra: number;
  id_insumo: number;
  id_requerimiento_detalle: number;
  cantidad: number;
  precio_compra: number;
  insumo?: Insumo;
  requerimiento_detalle?: RequerimientoDetalle;
}
