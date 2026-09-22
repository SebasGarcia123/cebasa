import { PartialType } from '@nestjs/mapped-types';
import { IsInt, IsOptional } from 'class-validator';
import { CreateTipoMovimientoDto } from './create-tipo-movimiento.dto.js';

// id_estado no está en CreateTipoMovimientoDto (el alta siempre arranca
// "Activo"), pero sí se puede cambiar al editar entre Activo/Anulado.
// TipoMovimientoService.update valida que el nombre resuelto sea uno de
// los dos.
export class UpdateTipoMovimientoDto extends PartialType(
  CreateTipoMovimientoDto,
) {
  @IsOptional()
  @IsInt()
  id_estado?: number;
}
