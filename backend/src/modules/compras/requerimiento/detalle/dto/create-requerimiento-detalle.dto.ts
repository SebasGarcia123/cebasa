import { IsInt, IsNumber, Min } from 'class-validator';

export class CreateRequerimientoDetalleDto {
  @IsInt()
  id_insumo: number;

  @IsNumber()
  @Min(0)
  cantidad: number;
}
