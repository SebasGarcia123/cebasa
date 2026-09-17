import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateTipoImpactoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  descripcion: string;
}
