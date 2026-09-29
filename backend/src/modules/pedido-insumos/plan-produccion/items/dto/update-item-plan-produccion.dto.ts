import { IsInt, IsOptional, Min } from 'class-validator';

// La fecha no se edita acá a propósito: si el día está mal, se borra
// el ítem y se carga de nuevo en el día correcto (mismo criterio que
// bobina/pallet, que tampoco dejan mover la fecha de una fila ya
// creada).
export class UpdateItemPlanProduccionDto {
  @IsOptional()
  @IsInt()
  id_lineas?: number;

  @IsOptional()
  @IsInt()
  id_producto?: number;

  @IsOptional()
  @IsInt()
  id_turno?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  cantidad?: number;
}
