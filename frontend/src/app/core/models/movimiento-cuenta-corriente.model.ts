import { TipoDocumento } from './tipo-documento.model';

export interface MovimientoCuentaCorriente {
  id_movimiento_cta_cte: number;
  fecha: string;
  monto: number;
  id_tipo_documento: number;
  saldo_resultante: number;
  id_cuenta_corriente: number;
  tipo_documento?: TipoDocumento;
}
