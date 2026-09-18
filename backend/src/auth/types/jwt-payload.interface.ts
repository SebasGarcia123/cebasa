export interface JwtPayload {
  sub: number;
  nombre_usuario: string;
  roles: string[];
  permisos: string[];
}
