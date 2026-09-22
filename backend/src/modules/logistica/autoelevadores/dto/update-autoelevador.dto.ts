import { PartialType } from '@nestjs/mapped-types';
import { IsInt, IsOptional } from 'class-validator';
import { CreateAutoelevadorDto } from './create-autoelevador.dto.js';

// id_estado no está en CreateAutoelevadorDto (el alta siempre arranca
// "Activo"), pero sí se puede cambiar al editar entre Activo/Anulado.
// AutoelevadoresService.update valida que el nombre resuelto sea uno de
// los dos.
export class UpdateAutoelevadorDto extends PartialType(CreateAutoelevadorDto) {
  @IsOptional()
  @IsInt()
  id_estado?: number;
}
