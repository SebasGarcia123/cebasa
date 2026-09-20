import { Producto } from './producto.model';
import { Linea } from './linea.model';
import { Turno } from './turno.model';

export interface ItemPlanProduccion {
  id_item_plan_produccion: number;
  id_plan_produccion: number;
  id_lineas: number;
  id_producto: number;
  id_turno: number;
  fecha: string;
  cantidad: number;
  productos?: Producto;
  lineas?: Linea;
  turnos?: Turno;
}
