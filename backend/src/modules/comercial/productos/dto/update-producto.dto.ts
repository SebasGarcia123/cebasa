import { PartialType } from '@nestjs/mapped-types';
import { IsInt, IsOptional } from 'class-validator';
import { CreateProductoDto } from './create-producto.dto.js';

// id_estado no está en CreateProductoDto (el alta siempre arranca
// "Activo"), pero sí se puede cambiar al editar entre Activo/Anulado.
// ProductosService.update valida que el nombre resuelto sea uno de los dos.
export class UpdateProductoDto extends PartialType(CreateProductoDto) {
  @IsOptional()
  @IsInt()
  id_estado?: number;
}
