import { IsIn, IsInt, IsOptional } from 'class-validator';

export class DespacharPedidoDto {
  @IsIn([2, 3])
  cantidad_copias: number;

  // Solo hace falta si el sector del usuario no alcanza para resolver
  // la planta (ej. un administrador sin sector real): ver
  // PedidosService.despachar.
  @IsOptional()
  @IsInt()
  id_deposito?: number;
}
