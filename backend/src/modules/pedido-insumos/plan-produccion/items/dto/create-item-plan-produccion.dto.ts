import { IsDateString, IsInt, Min } from 'class-validator';

export class CreateItemPlanProduccionDto {
  @IsInt()
  id_lineas: number;

  @IsInt()
  id_producto: number;

  @IsInt()
  id_turno: number;

  @IsDateString()
  fecha: string;

  @IsInt()
  @Min(1)
  cantidad: number;
}
