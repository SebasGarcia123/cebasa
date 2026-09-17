import { IsInt, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateChoferDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nombre_chofer: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  dni: string;

  @IsInt()
  id_direccion: number;

  @IsInt()
  id_estado: number;
}
