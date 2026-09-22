import { IsString, MaxLength, MinLength } from 'class-validator';

export class RechazarLoteProdDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  motivo_rechazo: string;
}
