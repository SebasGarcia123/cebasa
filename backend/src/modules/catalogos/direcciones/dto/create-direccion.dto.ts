import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateDireccionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  calle: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  numero?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  entrecalle1?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  entrecalle2?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  localidad: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  provincia: string;

  @IsInt()
  id_estado: number;
}
