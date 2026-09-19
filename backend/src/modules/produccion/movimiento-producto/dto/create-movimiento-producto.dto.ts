import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateMovimientoProductoDto {
  @IsInt()
  id_producto: number;

  @IsInt()
  id_tipo_movimiento: number;

  @IsInt()
  cantidad: number;

  @IsDateString()
  fecha_movimiento: string;

  @IsOptional()
  @IsInt()
  id_deposito_origen?: number;

  @IsOptional()
  @IsInt()
  id_deposito_destino?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  observaciones?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  motivo?: string;

  @IsInt()
  id_estado: number;
}
