import { IsDateString, IsOptional } from 'class-validator';

// El estado ya no se edita a mano acá: lo maneja cada endpoint de
// transición (cumplir/recibir/para-revisar/anular). Solo la fecha de
// necesidad se puede corregir mientras el pedido siga editable.
export class UpdatePedidoInsumosDto {
  @IsOptional()
  @IsDateString()
  fecha_necesidad?: string;
}
