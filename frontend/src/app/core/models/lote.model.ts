import { Estado } from './estado.model';
import { Chofer } from './chofer.model';
import { Camion } from './camion.model';
import { TipoLote } from './tipo-lote.model';
import { ItemLote } from './item-lote.model';

export interface Lote {
  id_lote: number;
  fecha_lote: string;
  id_chofer: number;
  id_camion: number;
  id_tipo_lote: number;
  id_estado: number;
  observaciones: string | null;
  motivo: string | null;
  chofer?: Chofer;
  camion?: Camion;
  tipo_lote?: TipoLote;
  estados?: Estado;
  item_lote?: ItemLote[];
}
