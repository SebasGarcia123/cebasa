import { IsDateString, IsOptional } from 'class-validator';

// fecha_salida null = desasignar (volver a dejar el pedido sin fecha
// de salida planificada).
export class AsignarFechaSalidaDto {
  @IsOptional()
  @IsDateString()
  fecha_salida?: string | null;
}
