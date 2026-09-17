import { IsInt, Min } from 'class-validator';

export class CreateItemPedidoDto {
  @IsInt()
  id_producto: number;

  @IsInt()
  @Min(1)
  cantidad_bolsones: number;
}
