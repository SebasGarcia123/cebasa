import { Injectable } from '@angular/core';
import { CrudApi } from './crud-api.service';
import { PlanProduccion } from '../models/plan-produccion.model';
import { components } from './schema';

type CreatePlanProduccionDto = components['schemas']['CreatePlanProduccionDto'];

@Injectable({ providedIn: 'root' })
export class PlanProduccionApiService extends CrudApi<PlanProduccion, CreatePlanProduccionDto> {
  protected override readonly resourcePath = 'planes-produccion';
}
