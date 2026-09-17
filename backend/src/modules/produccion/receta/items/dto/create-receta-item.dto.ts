import { IsInt, IsNumber, Min } from 'class-validator';

export class CreateRecetaItemDto {
  @IsInt()
  id_insumo: number;

  @IsNumber()
  @Min(0)
  cantidad_utilizada: number;
}
