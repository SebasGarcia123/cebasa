import { Sector } from './sector.model';
import { Estado } from './estado.model';
import { Rol } from './rol.model';

export interface Usuario {
  id_usuario: number;
  nombre_usuario: string;
  email: string | null;
  id_sector: number;
  id_estado: number;
  sectores?: Sector;
  estados?: Estado;
  usuario_roles?: { id_usuario: number; id_rol: number; roles: Rol }[];
}
