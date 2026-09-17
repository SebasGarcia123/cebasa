import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateFleteroDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nombre_fletero: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  cuit?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  telefono?: string;

  @IsInt()
  id_estado: number;
}
