import { IsInt, IsNumber, Min } from 'class-validator';

export class CreateRecetaItemDto {
  @IsInt()
  id_insumo: number;

  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  cantidad_utilizada: number;
}
