import { PartialType } from '@nestjs/mapped-types';
import { IsInt, IsOptional } from 'class-validator';
import { CreateDepositoDto } from './create-deposito.dto.js';

// id_estado no está en CreateDepositoDto (el alta siempre arranca
// "Activo"), pero sí se puede cambiar al editar entre Activo/Anulado.
// DepositoService.update valida que el nombre resuelto sea uno de los dos.
export class UpdateDepositoDto extends PartialType(CreateDepositoDto) {
  @IsOptional()
  @IsInt()
  id_estado?: number;
}
