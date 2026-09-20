import { Injectable } from '@angular/core';
import { CrudApi } from './crud-api.service';
import { TipoLote } from '../models/tipo-lote.model';
import { components } from './schema';

type CreateTipoLoteDto = components['schemas']['CreateTipoLoteDto'];

@Injectable({ providedIn: 'root' })
export class TipoLoteApiService extends CrudApi<TipoLote, CreateTipoLoteDto> {
  protected override readonly resourcePath = 'tipo-lote';
}
