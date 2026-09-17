import { IsInt, Min } from 'class-validator';

export class CreateItemProdDto {
  @IsInt()
  id_producto: number;

  @IsInt()
  @Min(1)
  cantidad: number;

  @IsInt()
  id_lineas: number;
}
