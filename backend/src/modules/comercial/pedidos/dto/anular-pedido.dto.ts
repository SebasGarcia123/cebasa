import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

// Cuál de los dos campos hace falta depende del estado del pedido al
// momento de anular (ver PedidosService.anular): "motivo" si estaba
// Cargado, "nro_nota_debito" si ya estaba Facturado.
export class AnularPedidoDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  motivo?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  nro_nota_debito?: string;
}
