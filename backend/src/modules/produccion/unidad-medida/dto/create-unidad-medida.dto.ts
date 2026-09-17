import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateUnidadMedidaDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  nombre_unidad_medida: string;
}
