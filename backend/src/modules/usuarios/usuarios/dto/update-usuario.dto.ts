import { PartialType } from '@nestjs/mapped-types';
import { IsInt, IsOptional } from 'class-validator';
import { CreateUsuarioDto } from './create-usuario.dto.js';

// id_estado no está en CreateUsuarioDto (el alta siempre arranca
// "Activo"), pero sí se puede cambiar al editar: un usuario cargado
// puede pasar a "Cancelado". UsuariosService.update valida que el
// nombre resuelto sea uno de los dos permitidos.
export class UpdateUsuarioDto extends PartialType(CreateUsuarioDto) {
  @IsOptional()
  @IsInt()
  id_estado?: number;
}
