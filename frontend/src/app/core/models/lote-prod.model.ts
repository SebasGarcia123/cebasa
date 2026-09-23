import { Estado } from './estado.model';
import { Turno } from './turno.model';
import { ItemProd } from './item-prod.model';
import { Deposito } from './deposito.model';

export interface LoteProd {
  id_lote: number;
  id_turno: number;
  fecha_lote_prod: string;
  id_estado: number;
  id_deposito: number;
  motivo_rechazo?: string | null;
  turnos?: Turno;
  estados?: Estado;
  deposito?: Deposito;
  item_prod?: ItemProd[];
}
