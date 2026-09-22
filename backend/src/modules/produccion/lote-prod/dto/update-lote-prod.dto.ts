import { PartialType } from '@nestjs/mapped-types';
import { IsInt, IsOptional } from 'class-validator';
import { CreateLoteProdDto } from './create-lote-prod.dto.js';

// id_estado no está en CreateLoteProdDto (el alta siempre arranca
// "Activo"), pero sí se puede cambiar al editar entre Activo/Anulado.
// LoteProdService.update valida que el nombre resuelto sea uno de los dos.
export class UpdateLoteProdDto extends PartialType(CreateLoteProdDto) {
  @IsOptional()
  @IsInt()
  id_estado?: number;
}
