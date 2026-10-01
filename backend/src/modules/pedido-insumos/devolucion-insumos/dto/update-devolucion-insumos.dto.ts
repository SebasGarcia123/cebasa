import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { ItemDevolucionInsumosInlineDto } from './create-devolucion-insumos.dto.js';

// Corregir una devolución Rechazada manda la lista completa de ítems
// de nuevo: se reemplaza entera, no se parchea de a uno (ver
// DevolucionInsumosService.update).
export class UpdateDevolucionInsumosDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ItemDevolucionInsumosInlineDto)
  items: ItemDevolucionInsumosInlineDto[];
}
