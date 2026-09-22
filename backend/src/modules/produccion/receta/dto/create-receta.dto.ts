import { IsInt } from 'class-validator';

export class CreateRecetaDto {
  @IsInt()
  id_producto: number;
}
