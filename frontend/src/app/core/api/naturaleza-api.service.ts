import { Injectable } from '@angular/core';
import { CrudApi } from './crud-api.service';
import { Naturaleza } from '../models/naturaleza.model';
import { components } from './schema';

type CreateNaturalezaDto = components['schemas']['CreateNaturalezaDto'];

@Injectable({ providedIn: 'root' })
export class NaturalezaApiService extends CrudApi<Naturaleza, CreateNaturalezaDto> {
  protected override readonly resourcePath = 'naturaleza';
}
