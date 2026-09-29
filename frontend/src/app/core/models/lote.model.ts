import { Estado } from './estado.model';
import { Chofer } from './chofer.model';
import { Camion } from './camion.model';
import { TipoLote } from './tipo-lote.model';
import { Deposito } from './deposito.model';
import { ItemLote } from './item-lote.model';

export interface Lote {
  id_lote: number;
  fecha_lote: string;
  id_chofer: number;
  id_camion: number;
  id_tipo_lote: number;
  id_estado: number;
  id_deposito_origen: number | null;
  id_deposito_destino: number | null;
  fecha_despacho: string | null;
  observaciones: string | null;
  motivo_rechazo: string | null;
  chofer?: Chofer;
  camion?: Camion;
  tipo_lote?: TipoLote;
  estados?: Estado;
  deposito_origen?: Deposito | null;
  deposito_destino?: Deposito | null;
  item_lote?: ItemLote[];
}
