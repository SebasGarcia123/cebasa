import { IsIn, IsInt, IsString, MaxLength, MinLength, ValidateIf } from 'class-validator';

export type TipoRechazo = 'redireccion' | 'no_corresponde';

// No incluye id_estado: el sistema decide el estado resultante según el
// tipo de rechazo (ver ReclamosService.rechazar):
// - "redireccion": el reclamo estaba mal asignado, se reasigna a otro
//   sector y sigue "Activo" (cambia de bandeja, no se rechaza en sí).
// - "no_corresponde": el reclamo no es válido, pasa a "Rechazado".
export class RechazarReclamoDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  motivo_rechazo: string;

  @IsIn(['redireccion', 'no_corresponde'])
  tipo_rechazo: TipoRechazo;

  @ValidateIf((dto: RechazarReclamoDto) => dto.tipo_rechazo === 'redireccion')
  @IsInt()
  id_sector_nuevo?: number;
}
