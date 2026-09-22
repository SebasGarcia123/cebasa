import { PartialType } from '@nestjs/mapped-types';
import { IsInt, IsOptional } from 'class-validator';
import { CreateMovimientoProductoDto } from './create-movimiento-producto.dto.js';

// id_estado no está en CreateMovimientoProductoDto (el alta siempre
// arranca "Activo"), pero sí se puede cambiar al editar entre
// Activo/Anulado. MovimientoProductoService.update valida que el
// nombre resuelto sea uno de los dos.
export class UpdateMovimientoProductoDto extends PartialType(
  CreateMovimientoProductoDto,
) {
  @IsOptional()
  @IsInt()
  id_estado?: number;
}
