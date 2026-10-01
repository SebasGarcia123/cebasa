import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsInt, IsOptional, IsString, MaxLength, Min, ValidateNested } from 'class-validator';

class CumplirItemDto {
  @IsInt()
  id_item_pedido_insumo: number;

  @Min(0)
  cantidad_abastecida: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  observaciones?: string;
}

// Logística carga, por cada ítem, cuánto abasteció realmente (puede
// ser menos que lo solicitado) y por qué si no llegó completo.
export class CumplirPedidoInsumosDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CumplirItemDto)
  items: CumplirItemDto[];
}
