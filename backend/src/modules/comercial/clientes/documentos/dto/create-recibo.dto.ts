import { IsNumber, IsOptional, IsPositive, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateReciboDto {
  @IsNumber()
  @IsPositive()
  monto: number;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  medio_pago: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  observaciones?: string;
}
