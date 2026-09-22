import { IsInt, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateTipoMovimientoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre_movimiento: string;

  @IsInt()
  id_naturaleza: number;
}
