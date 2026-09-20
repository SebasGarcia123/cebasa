import { Estado } from './estado.model';
import { Proveedor } from './proveedor.model';
import { CompraDetalle } from './compra-detalle.model';

export interface Compra {
  id_compra: number;
  fecha_compra: string;
  id_proveedor: number;
  id_estado: number;
  id_archivo_adjunto: number | null;
  proveedor?: Proveedor;
  estados?: Estado;
  compra_detalle?: CompraDetalle[];
}
