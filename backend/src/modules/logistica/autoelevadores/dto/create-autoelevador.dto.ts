import { IsDateString, IsInt, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateAutoelevadorDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre: string;

  @IsDateString()
  fecha_alta: string;

  @IsInt()
  id_estado: number;
}
