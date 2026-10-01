import { Cliente } from './cliente.model';
import { Estado } from './estado.model';
import { Producto } from './producto.model';

export type TipoPallet = 'ANGOSTO' | 'ANCHO_PESADO' | 'ANCHO_LIVIANO';
export type LadoCamion = 'CONDUCTOR' | 'ACOMPANANTE';

/** Fila del listado: un pedido a cargar en el día elegido. */
export interface PedidoACargar {
  id_pedido: number;
  fecha_efectiva: string | null;
  clientes?: Cliente;
  estados?: Estado;
  total_pallets: number;
  pallets_cargados: number;
  carga_iniciada: boolean;
}

/** Un pallet concreto a subir al camión. */
export interface CargaPallet {
  id_carga_pallet: number;
  id_pedido: number;
  id_item_pedido: number;
  nro_pallet: number;
  lado: LadoCamion | null;
  orden: number | null;
  cargado: boolean;
  fecha_carga: string | null;
  item_pedido?: {
    id_item_pedido: number;
    cantidad_bolsones: number;
    productos?: Producto;
  };
}
