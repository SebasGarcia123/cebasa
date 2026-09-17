import { IsInt, IsNumber, Min } from 'class-validator';

export class CreateCotizacionDetalleDto {
  @IsInt()
  id_requerimiento_detalle: number;

  @IsNumber()
  @Min(0)
  cantidad: number;

  @IsNumber()
  @Min(0)
  precio_cotizado: number;
}
