import { IsDateString, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateLoteDto {
  @IsDateString()
  fecha_lote: string;

  @IsInt()
  id_chofer: number;

  @IsInt()
  id_camion: number;

  @IsInt()
  id_tipo_lote: number;

  @IsInt()
  id_estado: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  observaciones?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  motivo?: string;
}
