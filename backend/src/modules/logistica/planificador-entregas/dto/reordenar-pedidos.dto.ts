import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsInt, ValidateNested } from 'class-validator';

class OrdenPedidoDto {
  @IsInt()
  id_pedido: number;

  @IsInt()
  orden_planificador: number;
}

// El frontend manda, de una, el orden recalculado de todos los
// pedidos que comparten la misma fecha_prometido que el que se
// arrastró (ver PlanificadorEntregasService — el orden manual solo
// desempata dentro del mismo grupo de fecha, nunca cruza fechas).
export class ReordenarPedidosDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrdenPedidoDto)
  ordenes: OrdenPedidoDto[];
}
