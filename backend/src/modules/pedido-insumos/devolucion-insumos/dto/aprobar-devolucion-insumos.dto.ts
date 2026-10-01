import { IsEnum, IsOptional } from 'class-validator';
import { Planta } from '../../../../generated/prisma/client.js';

export class AprobarDevolucionInsumosDto {
  // Solo hace falta si el sector de quien solicitó no alcanza para
  // resolver la planta (ej. un administrador sin sector real): ver
  // DevolucionInsumosService.aprobar.
  @IsOptional()
  @IsEnum(Planta)
  planta?: Planta;
}
