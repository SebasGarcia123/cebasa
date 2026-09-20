import { Estado } from './estado.model';
import { Proveedor } from './proveedor.model';
import { CotizacionDetalle } from './cotizacion-detalle.model';

export interface Cotizacion {
  id_cotizacion: number;
  id_proveedor: number;
  fecha_cotizacion: string;
  id_estado: number;
  id_archivo_adjunto: number | null;
  proveedor?: Proveedor;
  estados?: Estado;
  cotizacion_detalle?: CotizacionDetalle[];
}
