import { PartialType } from '@nestjs/mapped-types';
import { IsInt, IsOptional } from 'class-validator';
import { CreateRecetaDto } from './create-receta.dto.js';

// id_estado no está en CreateRecetaDto (el alta siempre arranca
// "Activo"), pero sí se puede cambiar al editar entre Activo/Anulado.
// RecetaService.update valida que el nombre resuelto sea uno de los dos.
export class UpdateRecetaDto extends PartialType(CreateRecetaDto) {
  @IsOptional()
  @IsInt()
  id_estado?: number;
}
