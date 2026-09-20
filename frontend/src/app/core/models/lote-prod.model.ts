import { Estado } from './estado.model';
import { Turno } from './turno.model';
import { ItemProd } from './item-prod.model';

export interface LoteProd {
  id_lote: number;
  id_turno: number;
  fecha_lote_prod: string;
  id_estado: number;
  turnos?: Turno;
  estados?: Estado;
  item_prod?: ItemProd[];
}
