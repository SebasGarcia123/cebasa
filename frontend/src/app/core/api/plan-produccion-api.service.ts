import { Injectable } from '@angular/core';
import { CrudApi } from './crud-api.service';
import { PlanProduccion } from '../models/plan-produccion.model';
import { components } from './schema';

type CreatePlanProduccionDto = components['schemas']['CreatePlanProduccionDto'];
// id_estado no está en el alta (arranca Activo), pero sí se puede
// editar después entre Activo/Anulado.
type UpdatePlanProduccionDto = Partial<CreatePlanProduccionDto> & { id_estado?: number };

@Injectable({ providedIn: 'root' })
export class PlanProduccionApiService extends CrudApi<PlanProduccion, CreatePlanProduccionDto, UpdatePlanProduccionDto> {
  protected override readonly resourcePath = 'planes-produccion';
}
