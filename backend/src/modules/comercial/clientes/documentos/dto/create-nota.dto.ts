import { IsInt, IsNumber, IsPositive, IsString, MaxLength, MinLength } from 'class-validator';

// Compartido por Nota de Crédito y Nota de Débito: misma forma, el
// signo del impacto en la cuenta corriente lo decide el service según
// cuál de las dos se esté generando.
export class CreateNotaDto {
  // La nota corrige una factura concreta del mismo cliente, y no puede
  // ser por más de lo que esa factura facturó (ver DocumentosService).
  @IsInt()
  id_factura: number;

  @IsNumber()
  @IsPositive()
  monto: number;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  motivo: string;
}
