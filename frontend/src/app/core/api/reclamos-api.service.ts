import { Injectable } from '@angular/core';
import { CrudApi } from './crud-api.service';
import { Reclamo } from '../models/reclamo.model';
import { components } from './schema';

type CreateReclamoDto = components['schemas']['CreateReclamoDto'];

@Injectable({ providedIn: 'root' })
export class ReclamosApiService extends CrudApi<Reclamo, CreateReclamoDto> {
  protected override readonly resourcePath = 'reclamos';
}
