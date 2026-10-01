import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MaxLength,
} from 'class-validator';
import { TipoPallet } from '../../../../generated/prisma/client.js';

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

  // Define el orden de carga que el sistema le sugiere al clarkista
  // (ver CargaPedidosService). Los productos que no van en pallet, como
  // las bobinas, quedan sin clasificar.
  @IsOptional()
  @IsEnum(TipoPallet)
  tipo_pallet?: TipoPallet;

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

  @IsOptional()
  @IsInt()
  id_archivo_adjunto?: number;

  @IsOptional()
  @IsInt()
  id_tipo_producto?: number;
}
