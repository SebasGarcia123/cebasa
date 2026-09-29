import { IsNumber, IsPositive, IsString, MaxLength, MinLength } from 'class-validator';

// Compartido por Nota de Crédito y Nota de Débito: misma forma, el
// signo del impacto en la cuenta corriente lo decide el service según
// cuál de las dos se esté generando.
export class CreateNotaDto {
  @IsNumber()
  @IsPositive()
  monto: number;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  motivo: string;
}
