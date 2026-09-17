import { IsDateString, IsInt, IsOptional } from 'class-validator';

export class CreateCotizacionDto {
  @IsInt()
  id_proveedor: number;

  @IsDateString()
  fecha_cotizacion: string;

  @IsInt()
  id_estado: number;

  @IsOptional()
  @IsInt()
  id_archivo_adjunto?: number;
}
