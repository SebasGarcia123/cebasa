import { RequerimientoDetalle } from './requerimiento-detalle.model';

export interface CotizacionDetalle {
  id_cotizacion_detalle: number;
  id_cotizacion: number;
  id_requerimiento_detalle: number;
  cantidad: number;
  precio_cotizado: number;
  requerimiento_detalle?: RequerimientoDetalle;
}
