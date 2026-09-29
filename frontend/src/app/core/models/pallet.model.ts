import { Producto } from './producto.model';
import { Linea } from './linea.model';
import { Usuario } from './usuario.model';

export interface Pallet {
  id_pallet: number;
  numero_lote: string;
  id_lote: number;
  id_producto: number;
  id_lineas: number;
  cantidad_bolsones: number;
  id_usuario: number;
  fecha_elaboracion: string;
  productos?: Producto;
  lineas?: Linea;
  usuarios?: Usuario;
}
