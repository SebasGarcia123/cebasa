import { TipoBobina } from './tipo-bobina.model';
import { Producto } from './producto.model';
import { Usuario } from './usuario.model';

export interface Bobina {
  id_bobina: number;
  numero_bobina: string;
  id_lote: number;
  id_tipo_bobina: number;
  id_producto: number;
  peso: number;
  gramaje: number;
  id_usuario: number;
  fecha_elaboracion: string;
  tipo_bobina?: TipoBobina;
  productos?: Producto;
  usuarios?: Usuario;
}
