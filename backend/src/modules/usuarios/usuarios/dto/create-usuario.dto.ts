import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
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

  // Para avisar por mail cuando se procesa un requerimiento que cargó
  // (ver RequerimientoService.generarOc). Opcional: si no está cargado,
  // simplemente no se envía el aviso.
  @IsOptional()
  @IsEmail()
  @MaxLength(150)
  email?: string;

  @IsInt()
  id_sector: number;

  @IsInt()
  id_estado: number;
}
