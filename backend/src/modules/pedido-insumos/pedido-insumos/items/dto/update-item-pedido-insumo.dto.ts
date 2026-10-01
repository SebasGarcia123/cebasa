import { IsInt, IsOptional, Min } from 'class-validator';

export class UpdateItemPedidoInsumoDto {
  @IsOptional()
  @IsInt()
  id_insumo?: number;

  @IsOptional()
  @IsInt()
  id_lineas?: number;

  @IsOptional()
  @Min(0.01)
  cantidad_solicitada?: number;
}
