import { Insumo } from './insumo.model';
import { Linea } from './linea.model';

export interface ItemPedidoInsumo {
  id_item_pedido_insumo: number;
  id_pedido_insumos: number;
  id_insumo: number;
  id_lineas: number;
  cantidad_solicitada: number;
  cantidad_abastecida: number;
  observaciones: string | null;
  insumo?: Insumo;
  lineas?: Linea;
}
