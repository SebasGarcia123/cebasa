import { Injectable } from '@angular/core';
import { CrudApi } from './crud-api.service';
import { Turno } from '../models/turno.model';
import { components } from './schema';

type CreateTurnoDto = components['schemas']['CreateTurnoDto'];

@Injectable({ providedIn: 'root' })
export class TurnosApiService extends CrudApi<Turno, CreateTurnoDto> {
  protected override readonly resourcePath = 'turnos';
}
