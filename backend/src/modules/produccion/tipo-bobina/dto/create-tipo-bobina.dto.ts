import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateTipoBobinaDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  descripcion: string;
}
