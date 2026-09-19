import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateReclamoDto {
  @IsDateString()
  fecha: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  descripcion?: string;

  @IsInt()
  id_cliente: number;

  @IsInt()
  id_estado: number;

  @IsInt()
  id_usuario: number;
}
