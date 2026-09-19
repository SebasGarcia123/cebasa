import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateArchivoAdjuntoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nombre_archivo: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  ruta_archivo: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  tipo_archivo?: string;

  @IsDateString()
  fecha_carga: string;
}
