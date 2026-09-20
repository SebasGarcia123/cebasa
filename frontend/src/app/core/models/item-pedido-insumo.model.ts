import { Insumo } from './insumo.model';

export interface ItemPedidoInsumo {
  id_item_pedido_insumo: number;
  id_pedido_insumos: number;
  id_insumo: number;
  cantidad_solicitada: number;
  cantidad_abastecida: number;
  insumo?: Insumo;
}
