import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateRolDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre_rol: string;

  // Un rol administrador salta por completo los guards de permisos y
  // roles (ver PermissionsGuard/RolesGuard): siempre tiene acceso total,
  // sin depender de que la tabla `permisos` tenga datos asignados.
  @IsOptional()
  @IsBoolean()
  es_administrador?: boolean;
}
