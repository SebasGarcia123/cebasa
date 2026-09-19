import {
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MaxLength,
} from 'class-validator';

export class CreateServicioAutoelevadorDto {
  @IsNumber()
  @Min(0)
  horas: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  detalle?: string;
}
