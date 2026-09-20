import { IsString, MaxLength, MinLength } from 'class-validator';

// No incluye id_estado: al resolver, el sistema asigna el estado "Resuelto".
export class ResolverReclamoDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  solucion: string;
}
