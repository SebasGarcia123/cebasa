import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateTipoLoteDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  descripcion_lote: string;
}
