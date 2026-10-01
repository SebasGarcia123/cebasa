import { IsInt, Min } from 'class-validator';

// Se usa para agregar un ítem a un pedido ya creado, mientras siga
// editable (Pendiente/Rechazado). cantidad_abastecida y observaciones
// las carga Logística al cumplir (ver CumplirPedidoInsumosDto), no acá.
export class CreateItemPedidoInsumoDto {
  @IsInt()
  id_insumo: number;

  @IsInt()
  id_lineas: number;

  @Min(0.01)
  cantidad_solicitada: number;
}
