import { IsInt, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateUsuarioDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre_usuario: string;

  @IsInt()
  id_sector: number;

  @IsInt()
  id_estado: number;
}
