import { Injectable } from '@angular/core';
import { CrudApi } from './crud-api.service';
import { TipoBobina } from '../models/tipo-bobina.model';
import { components } from './schema';

type CreateTipoBobinaDto = components['schemas']['CreateTipoBobinaDto'];

@Injectable({ providedIn: 'root' })
export class TipoBobinaApiService extends CrudApi<TipoBobina, CreateTipoBobinaDto> {
  protected override readonly resourcePath = 'tipo-bobina';
}
