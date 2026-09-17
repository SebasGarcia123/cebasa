import { IsInt, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateItemPedidoInsumoDto {
  @IsInt()
  id_insumo: number;

  @IsNumber()
  @Min(0)
  cantidad_solicitada: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cantidad_abastecida?: number;
}
