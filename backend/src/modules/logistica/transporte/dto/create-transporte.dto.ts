import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateTransporteDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nombre_transporte: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  cuit: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  nombre_contacto?: string;

  @IsInt()
  id_direccion: number;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  telefono?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  cbu_cuenta_bancaria?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  alias_cuenta_bancaria?: string;

  @IsInt()
  id_estado: number;
}
