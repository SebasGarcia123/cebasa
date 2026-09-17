import { IsInt } from 'class-validator';

export class CreateRecetaDto {
  @IsInt()
  id_producto: number;

  @IsInt()
  id_estado: number;
}
