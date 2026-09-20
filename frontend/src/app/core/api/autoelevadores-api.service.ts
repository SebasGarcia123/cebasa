import { Injectable } from '@angular/core';
import { CrudApi } from './crud-api.service';
import { Autoelevador } from '../models/autoelevador.model';
import { components } from './schema';

type CreateAutoelevadorDto = components['schemas']['CreateAutoelevadorDto'];

@Injectable({ providedIn: 'root' })
export class AutoelevadoresApiService extends CrudApi<Autoelevador, CreateAutoelevadorDto> {
  protected override readonly resourcePath = 'autoelevadores';
}
