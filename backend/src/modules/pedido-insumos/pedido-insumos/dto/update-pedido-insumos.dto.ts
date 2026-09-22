import { PartialType } from '@nestjs/mapped-types';
import { IsInt, IsOptional } from 'class-validator';
import { CreatePedidoInsumosDto } from './create-pedido-insumos.dto.js';

// id_estado no está en CreatePedidoInsumosDto (el alta siempre arranca
// "Activo"), pero sí se puede cambiar al editar entre Activo/Anulado.
// PedidoInsumosService.update valida que el nombre resuelto sea uno de
// los dos.
export class UpdatePedidoInsumosDto extends PartialType(
  CreatePedidoInsumosDto,
) {
  @IsOptional()
  @IsInt()
  id_estado?: number;
}
