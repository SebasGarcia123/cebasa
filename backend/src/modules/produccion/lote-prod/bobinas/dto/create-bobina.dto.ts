import { IsInt, IsNumber, Min } from 'class-validator';

// id_usuario (operario responsable) y fecha_elaboracion se completan
// solos (usuario autenticado, momento de la carga) — no se eligen a mano.
export class CreateBobinaDto {
  @IsInt()
  id_tipo_bobina: number;

  @IsInt()
  id_producto: number;

  @IsNumber()
  @Min(0.01)
  peso: number;

  @IsNumber()
  @Min(0.01)
  gramaje: number;
}
