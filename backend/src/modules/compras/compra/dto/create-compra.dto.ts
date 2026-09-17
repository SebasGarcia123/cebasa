import { IsDateString, IsInt, IsOptional } from 'class-validator';

export class CreateCompraDto {
  @IsDateString()
  fecha_compra: string;

  @IsInt()
  id_proveedor: number;

  @IsInt()
  id_estado: number;

  @IsOptional()
  @IsInt()
  id_archivo_adjunto?: number;
}
