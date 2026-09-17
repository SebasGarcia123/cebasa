import { IsInt, IsOptional, Min } from 'class-validator';

export class CreateStockInsumoDepositoDto {
  @IsInt()
  id_deposito: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  cantidad?: number;
}
