import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

// No incluye id_estado: un reclamo nuevo siempre arranca "Activo", lo
// asigna el sistema (ver ReclamosService.create).
export class CreateReclamoDto {
  @IsDateString()
  fecha: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  descripcion?: string;

  @IsInt()
  id_cliente: number;

  @IsInt()
  id_sector: number;

  @IsInt()
  id_usuario: number;
}
