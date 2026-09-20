import { Estado } from './estado.model';
import { Usuario } from './usuario.model';
import { RequerimientoDetalle } from './requerimiento-detalle.model';

export interface Requerimiento {
  id_requerimiento: number;
  id_usuario: number;
  fecha_carga: string;
  fecha_necesidad: string;
  observaciones: string | null;
  id_estado: number;
  usuarios?: Usuario;
  estados?: Estado;
  requerimiento_detalle?: RequerimientoDetalle[];
}
