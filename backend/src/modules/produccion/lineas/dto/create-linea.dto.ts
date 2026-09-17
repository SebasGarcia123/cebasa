import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateLineaDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  descripcion_lineas: string;
}
