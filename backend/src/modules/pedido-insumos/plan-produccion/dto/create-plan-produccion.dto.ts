import { IsDateString, IsInt } from 'class-validator';

export class CreatePlanProduccionDto {
  @IsInt()
  id_usuario: number;

  @IsDateString()
  fecha_inicio_semana: string;

  @IsInt()
  id_estado: number;
}
