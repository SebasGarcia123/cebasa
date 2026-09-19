import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateItemControlDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  item_nombre: string;

  @IsBoolean()
  estado_ok: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  observacion?: string;
}
