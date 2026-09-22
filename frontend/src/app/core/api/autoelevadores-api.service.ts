import { Injectable } from '@angular/core';
import { CrudApi } from './crud-api.service';
import { Autoelevador } from '../models/autoelevador.model';
import { components } from './schema';

type CreateAutoelevadorDto = components['schemas']['CreateAutoelevadorDto'];
// id_estado no está en el alta (arranca Activo), pero sí se puede
// editar después entre Activo/Anulado.
type UpdateAutoelevadorDto = Partial<CreateAutoelevadorDto> & { id_estado?: number };

@Injectable({ providedIn: 'root' })
export class AutoelevadoresApiService extends CrudApi<Autoelevador, CreateAutoelevadorDto, UpdateAutoelevadorDto> {
  protected override readonly resourcePath = 'autoelevadores';
}
