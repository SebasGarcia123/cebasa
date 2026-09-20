import { Injectable } from '@angular/core';
import { CrudApi } from './crud-api.service';
import { ControlAutoelevador } from '../models/control-autoelevador.model';
import { components } from './schema';

type CreateControlAutoelevadorDto = components['schemas']['CreateControlAutoelevadorDto'];

@Injectable({ providedIn: 'root' })
export class ControlAutoelevadorApiService extends CrudApi<ControlAutoelevador, CreateControlAutoelevadorDto> {
  protected override readonly resourcePath = 'controles-autoelevador';
}
