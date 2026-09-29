import { IsString, MaxLength, MinLength } from 'class-validator';

export class RechazarLoteDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  motivo_rechazo: string;
}
