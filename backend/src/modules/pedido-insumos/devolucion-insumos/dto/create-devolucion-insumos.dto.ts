import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsInt, Min, ValidateNested } from 'class-validator';

export class ItemDevolucionInsumosInlineDto {
  @IsInt()
  id_insumo: number;

  @IsInt()
  id_lineas: number;

  @Min(0.01)
  cantidad: number;
}

export class CreateDevolucionInsumosDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ItemDevolucionInsumosInlineDto)
  items: ItemDevolucionInsumosInlineDto[];
}
