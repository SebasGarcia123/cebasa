import { PartialType } from '@nestjs/mapped-types';
import { IsInt, IsOptional } from 'class-validator';
import { CreatePlanProduccionDto } from './create-plan-produccion.dto.js';

// id_estado no está en CreatePlanProduccionDto (el alta siempre arranca
// "Activo"), pero sí se puede cambiar al editar entre Activo/Anulado.
// PlanProduccionService.update valida que el nombre resuelto sea uno de
// los dos.
export class UpdatePlanProduccionDto extends PartialType(
  CreatePlanProduccionDto,
) {
  @IsOptional()
  @IsInt()
  id_estado?: number;
}
