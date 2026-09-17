import { IsInt, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateTurnoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  descripcion_turnos: string;

  @IsInt()
  id_estado: number;
}
