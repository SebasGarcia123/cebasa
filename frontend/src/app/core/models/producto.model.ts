import { ArchivoAdjunto } from './archivo-adjunto.model';
import { Estado } from './estado.model';
import { TipoProducto } from './tipo-producto.model';

export interface Producto {
  id_producto: number;
  codigo_producto: string;
  descripcion_producto: string;
  bolsones_por_pallet: number | null;
  peso_por_bolson: number | null;
  precio_venta: number;
  stock_actual: number;
  stock_minimo: number;
  id_estado: number;
  id_archivo_adjunto: number | null;
  id_tipo_producto: number | null;
  archivo_adjunto: ArchivoAdjunto | null;
  estados?: Estado;
  tipo_producto?: TipoProducto | null;
}
