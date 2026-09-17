import { IsInt, IsNumber, Min } from 'class-validator';

export class CreateCompraDetalleDto {
  @IsInt()
  id_insumo: number;

  @IsInt()
  id_requerimiento_detalle: number;

  @IsNumber()
  @Min(0)
  cantidad: number;

  @IsNumber()
  @Min(0)
  precio_compra: number;
}
