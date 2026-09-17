import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCamionDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  marca?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  modelo?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  dominio_chasis: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  dominio_semi?: string;
}
