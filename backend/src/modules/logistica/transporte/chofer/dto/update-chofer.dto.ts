import { PartialType } from '@nestjs/mapped-types';
import { IsInt, IsOptional } from 'class-validator';
import { CreateChoferDto } from './create-chofer.dto.js';

// id_estado no está en CreateChoferDto (el alta siempre arranca
// "Activo"), pero sí se puede cambiar al editar entre Activo/Anulado.
// ChoferService.update valida que el nombre resuelto sea uno de los dos.
export class UpdateChoferDto extends PartialType(CreateChoferDto) {
  @IsOptional()
  @IsInt()
  id_estado?: number;
}
