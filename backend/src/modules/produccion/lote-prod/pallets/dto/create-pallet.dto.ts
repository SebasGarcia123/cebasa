import { IsInt, Min } from 'class-validator';

// id_usuario (operario de carga), numero_lote y fecha_elaboracion se
// completan solos (usuario autenticado, fecha del lote, código del
// producto elegido) — no se eligen a mano.
export class CreatePalletDto {
  @IsInt()
  id_producto: number;

  @IsInt()
  id_lineas: number;

  @IsInt()
  @Min(1)
  cantidad_bolsones: number;
}
