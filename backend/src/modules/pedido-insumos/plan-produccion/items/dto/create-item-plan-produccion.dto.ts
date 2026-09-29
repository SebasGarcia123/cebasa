import { IsDateString, IsInt, Min } from 'class-validator';

export class CreateItemPlanProduccionDto {
  @IsDateString()
  fecha: string;

  @IsInt()
  id_lineas: number;

  @IsInt()
  id_producto: number;

  @IsInt()
  id_turno: number;

  @IsInt()
  @Min(1)
  cantidad: number;
}
