import { IsDateString, IsInt } from 'class-validator';

export class CreateLoteProdDto {
  @IsInt()
  id_turno: number;

  @IsDateString()
  fecha_lote_prod: string;

  // Planta donde se produjo el lote: define de qué depósito se
  // descuentan los insumos de la receta al aprobarlo (ver
  // LoteProdService.aprobar).
  @IsInt()
  id_deposito: number;
}
