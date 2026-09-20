import { PartialType } from '@nestjs/mapped-types';
import { IsInt, IsOptional } from 'class-validator';
import { CreateClienteDto } from './create-cliente.dto.js';

// id_estado no está en CreateClienteDto (el alta siempre arranca
// "Activo"), pero sí se puede cambiar al editar: un cliente cargado
// puede pasar a "Cancelado". ClientesService.update valida que el
// nombre resuelto sea uno de los dos permitidos.
export class UpdateClienteDto extends PartialType(CreateClienteDto) {
  @IsOptional()
  @IsInt()
  id_estado?: number;
}
