import { IsDateString, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreatePedidoInsumosDto {
  @IsInt()
  id_usuario: number;

  @IsDateString()
  fecha_carga: string;

  @IsDateString()
  fecha_necesidad: string;

  @IsInt()
  id_estado: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  motivo_rechazo?: string;
}
