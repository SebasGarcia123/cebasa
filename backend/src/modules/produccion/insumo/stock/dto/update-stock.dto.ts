import { IsInt, Min } from 'class-validator';

export class UpdateStockInsumoDepositoDto {
  @IsInt()
  @Min(0)
  cantidad: number;
}
