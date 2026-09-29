import { IsInt } from 'class-validator';

export class CreateFacturaDto {
  @IsInt()
  id_pedido: number;
}
