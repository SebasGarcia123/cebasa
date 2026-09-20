import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  Min,
  ValidateNested,
} from 'class-validator';

export class GenerarOcItemDto {
  @IsInt()
  id_requerimiento_detalle: number;

  @IsNumber()
  @Min(0)
  precio_compra: number;
}

export class GenerarOcDto {
  @IsInt()
  id_proveedor: number;

  @IsOptional()
  @IsInt()
  id_archivo_adjunto?: number;

  // true: se manda por mail al proveedor apenas se genera (queda "Enviado
  // a Proveedor"). false: queda "Autorizado", a la espera de que alguien
  // la envíe después (ver CompraService.enviarProveedor).
  @IsBoolean()
  enviar_a_proveedor: boolean;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => GenerarOcItemDto)
  items: GenerarOcItemDto[];
}
