import { PartialType } from '@nestjs/mapped-types';
import { IsInt, IsOptional } from 'class-validator';
import { CreateTurnoDto } from './create-turno.dto.js';

// id_estado no está en CreateTurnoDto (el alta siempre arranca
// "Activo"), pero sí se puede cambiar al editar entre Activo/Anulado.
// TurnosService.update valida que el nombre resuelto sea uno de los dos.
export class UpdateTurnoDto extends PartialType(CreateTurnoDto) {
  @IsOptional()
  @IsInt()
  id_estado?: number;
}
