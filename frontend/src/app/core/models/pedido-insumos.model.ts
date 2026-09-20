import { Estado } from './estado.model';
import { Usuario } from './usuario.model';
import { ItemPedidoInsumo } from './item-pedido-insumo.model';

export interface PedidoInsumos {
  id_pedido_insumos: number;
  id_usuario: number;
  fecha_carga: string;
  fecha_necesidad: string;
  id_estado: number;
  motivo_rechazo: string | null;
  usuarios?: Usuario;
  estados?: Estado;
  item_pedido_insumo?: ItemPedidoInsumo[];
}
