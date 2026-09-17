import { IsDateString, IsInt, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateMovimientoInsumoDto {
  @IsInt()
  id_insumo: number;

  @IsInt()
  id_tipo_movimiento: number;

  @IsNumber()
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
  @IsInt()
  id_item_pedido_insumo?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  motivo?: string;

  @IsInt()
  id_estado: number;
}
