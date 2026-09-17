import { IsDateString, IsInt } from 'class-validator';

export class CreateLoteProdDto {
  @IsInt()
  id_turno: number;

  @IsDateString()
  fecha_lote_prod: string;

  @IsInt()
  id_estado: number;
}
