import { IsDateString, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

// No incluye fecha_carga ni id_estado: los pone el sistema. fecha_carga
// siempre es "hoy" (ver RequerimientoService.create) y el estado arranca
// "Activo", igual que reclamos/clientes.
export class CreateRequerimientoDto {
  @IsInt()
  id_usuario: number;

  @IsDateString()
  fecha_necesidad: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  observaciones?: string;
}
