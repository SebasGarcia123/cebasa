import { IsIn } from 'class-validator';

export class DespacharPedidoDto {
  @IsIn([2, 3])
  cantidad_copias: number;
}
