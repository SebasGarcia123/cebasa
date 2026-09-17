import { IsDateString, IsInt, IsNumber } from 'class-validator';

export class CreateMovimientoCuentaCorrienteDto {
  @IsDateString()
  fecha: string;

  @IsNumber()
  monto: number;

  @IsInt()
  id_tipo_documento: number;

  @IsNumber()
  saldo_resultante: number;
}
