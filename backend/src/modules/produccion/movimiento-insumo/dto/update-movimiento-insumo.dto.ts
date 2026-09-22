import { PartialType } from '@nestjs/mapped-types';
import { IsInt, IsOptional } from 'class-validator';
import { CreateMovimientoInsumoDto } from './create-movimiento-insumo.dto.js';

// id_estado no está en CreateMovimientoInsumoDto (el alta siempre
// arranca "Activo"), pero sí se puede cambiar al editar entre
// Activo/Anulado. MovimientoInsumoService.update valida que el nombre
// resuelto sea uno de los dos.
export class UpdateMovimientoInsumoDto extends PartialType(
  CreateMovimientoInsumoDto,
) {
  @IsOptional()
  @IsInt()
  id_estado?: number;
}
