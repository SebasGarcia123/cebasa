import { PartialType } from '@nestjs/mapped-types';
import { IsInt, IsOptional } from 'class-validator';
import { CreateLoteDto } from './create-lote.dto.js';

// id_estado no está en CreateLoteDto (el alta siempre arranca "Activo"),
// pero sí se puede cambiar al editar entre Activo/Anulado.
// LotesService.update valida que el nombre resuelto sea uno de los dos.
export class UpdateLoteDto extends PartialType(CreateLoteDto) {
  @IsOptional()
  @IsInt()
  id_estado?: number;
}
