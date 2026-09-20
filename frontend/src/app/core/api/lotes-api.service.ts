import { Injectable } from '@angular/core';
import { CrudApi } from './crud-api.service';
import { Lote } from '../models/lote.model';
import { components } from './schema';

type CreateLoteDto = components['schemas']['CreateLoteDto'];

@Injectable({ providedIn: 'root' })
export class LotesApiService extends CrudApi<Lote, CreateLoteDto> {
  protected override readonly resourcePath = 'lotes';
}
