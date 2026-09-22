import { Injectable } from '@angular/core';
import { CrudApi } from './crud-api.service';
import { Turno } from '../models/turno.model';
import { components } from './schema';

type CreateTurnoDto = components['schemas']['CreateTurnoDto'];
// id_estado no está en el alta (arranca Activo), pero sí se puede
// editar después entre Activo/Anulado.
type UpdateTurnoDto = Partial<CreateTurnoDto> & { id_estado?: number };

@Injectable({ providedIn: 'root' })
export class TurnosApiService extends CrudApi<Turno, CreateTurnoDto, UpdateTurnoDto> {
  protected override readonly resourcePath = 'turnos';
}
