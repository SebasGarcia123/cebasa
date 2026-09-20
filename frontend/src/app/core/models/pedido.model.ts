import { Cliente } from './cliente.model';
import { Estado } from './estado.model';
import { ItemPedido } from './item-pedido.model';

export interface Pedido {
  id_pedido: number;
  id_cliente: number;
  fecha_carga: string;
  fecha_prometido: string | null;
  id_estado: number;
  id_usuario: number;
  clientes?: Cliente;
  estados?: Estado;
  item_pedido?: ItemPedido[];
}
