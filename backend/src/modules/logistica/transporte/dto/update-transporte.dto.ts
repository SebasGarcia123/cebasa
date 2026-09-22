import { PartialType } from '@nestjs/mapped-types';
import { IsInt, IsOptional } from 'class-validator';
import { CreateTransporteDto } from './create-transporte.dto.js';

// id_estado no está en CreateTransporteDto (el alta siempre arranca
// "Activo"), pero sí se puede cambiar al editar entre Activo/Anulado.
// TransporteService.update valida que el nombre resuelto sea uno de los
// dos.
export class UpdateTransporteDto extends PartialType(CreateTransporteDto) {
  @IsOptional()
  @IsInt()
  id_estado?: number;
}
