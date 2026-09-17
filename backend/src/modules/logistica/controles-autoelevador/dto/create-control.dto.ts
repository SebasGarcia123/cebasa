import { IsDateString, IsInt } from 'class-validator';

export class CreateControlAutoelevadorDto {
  @IsDateString()
  fecha: string;

  @IsInt()
  id_usuario: number;

  @IsInt()
  id_autoelevador: number;
}
