import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

// No incluye id_estado: un cliente nuevo siempre arranca "Activo", lo
// asigna el sistema (ver ClientesService.create).
export class CreateClienteDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nombre_cli: string;

  @IsInt()
  id_direccion: number;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  telefono_cli?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(150)
  email_cli?: string;
}
