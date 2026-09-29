import { TipoDocumento } from './tipo-documento.model';

export interface MovimientoCuentaCorriente {
  id_movimiento_cta_cte: number;
  fecha: string;
  monto: number;
  id_tipo_documento: number;
  saldo_resultante: number;
  id_cuenta_corriente: number;
  id_factura?: number | null;
  id_recibo?: number | null;
  id_nota_credito?: number | null;
  id_nota_debito?: number | null;
  tipo_documento?: TipoDocumento;
}
