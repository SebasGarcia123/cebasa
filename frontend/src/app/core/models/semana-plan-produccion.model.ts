import { ItemPlanProduccion } from './item-plan-produccion.model';
import { DiaNoLaborable } from './dia-no-laborable.model';

export interface DiaPlanProduccion {
  fecha: string;
  no_laborable: DiaNoLaborable | null;
  items: ItemPlanProduccion[];
}

export interface SemanaPlanProduccion {
  fecha_inicio_semana: string;
  // false si todavía no se cargó nada en esta semana (ni un ítem ni un
  // día no laborable) — la pantalla muestra "aún no hay plan cargado".
  existe: boolean;
  // Siempre 5: lunes a viernes.
  dias: DiaPlanProduccion[];
}
