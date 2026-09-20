import { Injectable } from '@angular/core';
import { CrudApi } from './crud-api.service';
import { Requerimiento } from '../models/requerimiento.model';
import { components } from './schema';

type CreateRequerimientoDto = components['schemas']['CreateRequerimientoDto'];

@Injectable({ providedIn: 'root' })
export class RequerimientosApiService extends CrudApi<Requerimiento, CreateRequerimientoDto> {
  protected override readonly resourcePath = 'requerimientos';
}
