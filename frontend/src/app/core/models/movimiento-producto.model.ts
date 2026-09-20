import { Estado } from './estado.model';
import { Producto } from './producto.model';
import { TipoMovimiento } from './tipo-movimiento.model';
import { Deposito } from './deposito.model';

export interface MovimientoProducto {
  id_movimiento_producto: number;
  id_producto: number;
  id_tipo_movimiento: number;
  cantidad: number;
  fecha_movimiento: string;
  id_deposito_origen: number | null;
  id_deposito_destino: number | null;
  observaciones: string | null;
  motivo: string | null;
  id_estado: number;
  productos?: Producto;
  tipo_movimiento?: TipoMovimiento;
  deposito_origen?: Deposito;
  deposito_destino?: Deposito;
  estados?: Estado;
}
