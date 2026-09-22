import { Injectable } from '@angular/core';
import { CrudApi } from './crud-api.service';
import { Fletero } from '../models/fletero.model';
import { components } from './schema';

type CreateFleteroDto = components['schemas']['CreateFleteroDto'];
// id_estado no está en el alta (arranca Activo), pero sí se puede
// editar después entre Activo/Anulado.
type UpdateFleteroDto = Partial<CreateFleteroDto> & { id_estado?: number };

@Injectable({ providedIn: 'root' })
export class FleteroApiService extends CrudApi<Fletero, CreateFleteroDto, UpdateFleteroDto> {
  protected override readonly resourcePath = 'fletero';
}
