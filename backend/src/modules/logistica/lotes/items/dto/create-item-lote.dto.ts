import { IsInt, IsNumber, IsOptional, Min } from 'class-validator';

// Exactamente uno de id_producto/id_insumo (se valida en el service,
// mismo criterio que ajuste_stock).
export class CreateItemLoteDto {
  @IsOptional()
  @IsInt()
  id_producto?: number;

  @IsOptional()
  @IsInt()
  id_insumo?: number;

  @IsNumber()
  @Min(0.01)
  cantidad: number;
}
