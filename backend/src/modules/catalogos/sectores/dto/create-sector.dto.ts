import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateSectorDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombreSector: string;
}
