export interface CurrentUser {
  id_usuario: number;
  nombre_usuario: string;
  roles: string[];
  permisos: string[];
  es_administrador: boolean;
}
