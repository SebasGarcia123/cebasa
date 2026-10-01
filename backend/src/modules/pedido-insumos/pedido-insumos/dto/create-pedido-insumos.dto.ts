import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsDateString, IsInt, Min, ValidateNested } from 'class-validator';

class ItemPedidoInsumosInlineDto {
  @IsInt()
  id_insumo: number;

  @IsInt()
  id_lineas: number;

  @Min(0.01)
  cantidad_solicitada: number;
}

// id_usuario (quien solicita) y fecha_carga (hoy) se completan solos —
// no se eligen a mano. El pedido se crea con sus ítems de una: no hay
// alta de cabecera vacía a la que se le van sumando ítems después.
export class CreatePedidoInsumosDto {
  @IsDateString()
  fecha_necesidad: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ItemPedidoInsumosInlineDto)
  items: ItemPedidoInsumosInlineDto[];
}
