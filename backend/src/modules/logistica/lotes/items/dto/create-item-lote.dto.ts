import { IsInt, IsNotEmpty, IsNumber, IsString, Min, MaxLength } from 'class-validator';

export class CreateItemLoteDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  descripcion_item: string;

  @IsInt()
  id_unidad_medida: number;

  @IsNumber()
  @Min(0)
  cantidad_item_lote: number;
}
