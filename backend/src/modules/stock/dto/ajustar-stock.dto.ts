import { IsInt, IsNotEmpty, IsString, Min, MaxLength } from 'class-validator';

// cantidad_nueva es el nuevo total EN ESE DEPÓSITO puntual, no el total
// global del producto/insumo (que ahora es la suma de todos los
// depósitos, ver StockService).
export class AjustarStockDto {
  @IsInt()
  id_deposito: number;

  @IsInt()
  @Min(0)
  cantidad_nueva: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  motivo: string;
}
