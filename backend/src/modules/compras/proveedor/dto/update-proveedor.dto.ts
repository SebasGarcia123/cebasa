import { PartialType } from '@nestjs/mapped-types';
import { IsInt, IsOptional } from 'class-validator';
import { CreateProveedorDto } from './create-proveedor.dto.js';

// id_estado no está en CreateProveedorDto (el alta siempre arranca
// "Activo"), pero sí se puede cambiar al editar entre Activo/Anulado.
// ProveedorService.update valida que el nombre resuelto sea uno de los dos.
export class UpdateProveedorDto extends PartialType(CreateProveedorDto) {
  @IsOptional()
  @IsInt()
  id_estado?: number;
}
