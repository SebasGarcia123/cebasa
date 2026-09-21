import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  MaxLength,
} from 'class-validator';

export class CreateInsumoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  codigo_insumo: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre_insumo: string;

  @IsInt()
  id_unidad_medida: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  stock_minimo?: number;

  @IsOptional()
  @IsBoolean()
  stockeable?: boolean;
}
