import { Cliente } from './cliente.model';
import { Estado } from './estado.model';
import { ItemPedido } from './item-pedido.model';
import { Deposito } from './deposito.model';

export interface Pedido {
  id_pedido: number;
  id_cliente: number;
  fecha_carga: string;
  fecha_prometido: string | null;
  id_estado: number;
  id_usuario: number;
  id_deposito: number | null;
  cantidad_copias: number | null;
  fecha_despacho: string | null;
  id_archivo_remito: number | null;
  motivo_anulacion: string | null;
  nro_nota_debito: string | null;
  clientes?: Cliente;
  estados?: Estado;
  deposito?: Deposito;
  item_pedido?: ItemPedido[];
}
