import { IsNumber, IsOptional, Min } from 'class-validator';

export class CreateCuentaCorrienteDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  limite_credito?: number;
}
