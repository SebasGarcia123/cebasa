import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateDepositoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre_deposito: string;
}
