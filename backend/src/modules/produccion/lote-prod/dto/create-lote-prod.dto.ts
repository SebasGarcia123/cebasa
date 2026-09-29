import { IsDateString, IsInt, IsOptional } from 'class-validator';

export class CreateLoteProdDto {
  @IsInt()
  id_turno: number;

  @IsDateString()
  fecha_lote_prod: string;

  // Se ignora para cualquier usuario cuyo sector resuelva a una planta
  // (ver LoteProdService.resolverDepositoDeCreacion): el depósito del
  // lote lo decide el sector del usuario logueado, no un valor que
  // mande el cliente — así un Jefe de Producción Caseros no puede
  // terminar creando un lote de Baradero. Solo se usa como respaldo
  // manual para administradores sin planta asignada.
  @IsOptional()
  @IsInt()
  id_deposito?: number;
}
