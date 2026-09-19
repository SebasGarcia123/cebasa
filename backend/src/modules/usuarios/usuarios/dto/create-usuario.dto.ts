import {
  IsInt,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUsuarioDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre_usuario: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;

  @IsInt()
  id_sector: number;

  @IsInt()
  id_estado: number;
}
