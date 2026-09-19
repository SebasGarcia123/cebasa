import { Injectable } from '@angular/core';
import { CrudApi } from './crud-api.service';
import { Estado } from '../models/estado.model';
import { components } from './schema';

type CreateEstadoDto = components['schemas']['CreateEstadoDto'];

@Injectable({ providedIn: 'root' })
export class EstadosApiService extends CrudApi<Estado, CreateEstadoDto> {
  protected override readonly resourcePath = 'estados';
}
