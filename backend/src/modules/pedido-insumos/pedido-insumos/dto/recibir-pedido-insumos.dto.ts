import { IsEnum, IsOptional } from 'class-validator';
import { Planta } from '../../../../generated/prisma/client.js';

export class RecibirPedidoInsumosDto {
  // Solo hace falta si el sector de quien solicitó no alcanza para
  // resolver la planta (ej. un administrador sin sector real): ver
  // PedidoInsumosService.recibir.
  @IsOptional()
  @IsEnum(Planta)
  planta?: Planta;
}
