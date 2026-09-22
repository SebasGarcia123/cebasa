import { PartialType } from '@nestjs/mapped-types';
import { IsInt, IsOptional } from 'class-validator';
import { CreatePedidoDto } from './create-pedido.dto.js';

// id_estado no está en CreatePedidoDto (el alta siempre arranca
// "Activo"), pero sí se puede cambiar al editar entre Activo/Anulado.
// PedidosService.update valida que el nombre resuelto sea uno de los dos.
export class UpdatePedidoDto extends PartialType(CreatePedidoDto) {
  @IsOptional()
  @IsInt()
  id_estado?: number;
}
