import { IsDateString, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateRequerimientoDto {
  @IsInt()
  id_usuario: number;

  @IsDateString()
  fecha_carga: string;

  @IsDateString()
  fecha_necesidad: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  observaciones?: string;

  @IsInt()
  id_estado: number;
}
