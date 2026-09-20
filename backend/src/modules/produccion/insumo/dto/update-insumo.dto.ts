import { PartialType } from '@nestjs/mapped-types';
import { IsInt, IsOptional } from 'class-validator';
import { CreateInsumoDto } from './create-insumo.dto.js';

// id_estado no está en CreateInsumoDto (el alta siempre arranca "Activo"),
// pero sí se puede cambiar al editar entre Activo/Anulado. stock_actual
// tampoco está en ningún lado: no es un campo editable a mano, solo se
// mueve a través de los movimientos de insumo.
export class UpdateInsumoDto extends PartialType(CreateInsumoDto) {
  @IsOptional()
  @IsInt()
  id_estado?: number;
}
