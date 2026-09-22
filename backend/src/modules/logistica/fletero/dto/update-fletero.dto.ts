import { PartialType } from '@nestjs/mapped-types';
import { IsInt, IsOptional } from 'class-validator';
import { CreateFleteroDto } from './create-fletero.dto.js';

// id_estado no está en CreateFleteroDto (el alta siempre arranca
// "Activo"), pero sí se puede cambiar al editar entre Activo/Anulado.
// FleteroService.update valida que el nombre resuelto sea uno de los dos.
export class UpdateFleteroDto extends PartialType(CreateFleteroDto) {
  @IsOptional()
  @IsInt()
  id_estado?: number;
}
