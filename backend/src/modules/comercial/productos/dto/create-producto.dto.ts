import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min, MaxLength } from 'class-validator';

export class CreateProductoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  codigo_producto: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  descripcion_producto: string;

  @IsOptional()
  @IsInt()
  bolsones_por_pallet?: number;

  @IsOptional()
  @IsNumber()
  peso_por_bolson?: number;

  @IsNumber()
  precio_venta: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  stock_actual?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  stock_minimo?: number;

  @IsInt()
  id_estado: number;
}
