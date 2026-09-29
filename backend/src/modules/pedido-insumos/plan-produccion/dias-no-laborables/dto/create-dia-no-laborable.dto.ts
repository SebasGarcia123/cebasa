import { IsDateString, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateDiaNoLaborableDto {
  @IsDateString()
  fecha: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  motivo: string;
}
