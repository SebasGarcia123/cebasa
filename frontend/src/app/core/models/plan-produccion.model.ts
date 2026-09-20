import { Estado } from './estado.model';
import { Usuario } from './usuario.model';
import { ItemPlanProduccion } from './item-plan-produccion.model';

export interface PlanProduccion {
  id_plan_produccion: number;
  id_usuario: number;
  fecha_inicio_semana: string;
  id_estado: number;
  usuarios?: Usuario;
  estados?: Estado;
  item_plan_produccion?: ItemPlanProduccion[];
}
