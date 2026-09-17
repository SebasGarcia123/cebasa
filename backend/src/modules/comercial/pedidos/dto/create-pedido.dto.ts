import { IsDateString, IsInt, IsOptional } from 'class-validator';

export class CreatePedidoDto {
  @IsInt()
  id_cliente: number;

  @IsDateString()
  fecha_carga: string;

  @IsOptional()
  @IsDateString()
  fecha_prometido?: string;

  @IsInt()
  id_estado: number;

  @IsInt()
  id_usuario: number;
}
