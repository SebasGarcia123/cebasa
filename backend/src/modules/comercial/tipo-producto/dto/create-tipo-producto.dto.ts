import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateTipoProductoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  descripcion: string;
}
