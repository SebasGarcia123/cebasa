import { Estado } from './estado.model';
import { Insumo } from './insumo.model';
import { TipoMovimiento } from './tipo-movimiento.model';
import { Deposito } from './deposito.model';

export interface MovimientoInsumo {
  id_movimiento_insumo: number;
  id_insumo: number;
  id_tipo_movimiento: number;
  cantidad: number;
  fecha_movimiento: string;
  id_deposito_origen: number | null;
  id_deposito_destino: number | null;
  observaciones: string | null;
  id_item_pedido_insumo: number | null;
  motivo: string | null;
  id_estado: number;
  insumo?: Insumo;
  tipo_movimiento?: TipoMovimiento;
  deposito_origen?: Deposito;
  deposito_destino?: Deposito;
  estados?: Estado;
}
