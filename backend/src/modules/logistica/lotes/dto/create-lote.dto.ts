import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

// id_deposito_origen/id_deposito_destino son opcionales acá porque el
// modelo es compartido con otros tipo_lote que no los necesiten, pero
// LotesService.create los exige (y distintos entre sí) para el tipo
// "Interplanta".
export class CreateLoteDto {
  @IsDateString()
  fecha_lote: string;

  @IsInt()
  id_chofer: number;

  @IsInt()
  id_camion: number;

  @IsInt()
  id_tipo_lote: number;

  @IsOptional()
  @IsInt()
  id_deposito_origen?: number;

  @IsOptional()
  @IsInt()
  id_deposito_destino?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  observaciones?: string;
}
