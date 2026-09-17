import { IsInt, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateTipoDocumentoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  descripcion: string;

  @IsInt()
  id_tipo_impacto: number;
}
