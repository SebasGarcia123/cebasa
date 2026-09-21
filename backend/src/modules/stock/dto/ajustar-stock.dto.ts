import { IsInt, IsNotEmpty, IsString, Min, MaxLength } from 'class-validator';

export class AjustarStockDto {
  @IsInt()
  @Min(0)
  cantidad_nueva: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  motivo: string;
}
