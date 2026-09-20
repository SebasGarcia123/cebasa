import { Producto } from './producto.model';

export interface ItemPedido {
  id_item_pedido: number;
  id_producto: number;
  cantidad_bolsones: number;
  id_pedido: number;
  productos?: Producto;
}
