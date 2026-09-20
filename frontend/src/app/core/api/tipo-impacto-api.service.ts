import { Injectable } from '@angular/core';
import { CrudApi } from './crud-api.service';
import { TipoImpacto } from '../models/tipo-impacto.model';
import { components } from './schema';

type CreateTipoImpactoDto = components['schemas']['CreateTipoImpactoDto'];

@Injectable({ providedIn: 'root' })
export class TipoImpactoApiService extends CrudApi<TipoImpacto, CreateTipoImpactoDto> {
  protected override readonly resourcePath = 'tipo-impacto';
}
