import { Injectable } from '@angular/core';
import { CrudApi } from './crud-api.service';
import { Receta } from '../models/receta.model';
import { components } from './schema';

type CreateRecetaDto = components['schemas']['CreateRecetaDto'];
// id_estado no está en el alta (arranca Activo), pero sí se puede
// editar después entre Activo/Anulado.
type UpdateRecetaDto = Partial<CreateRecetaDto> & { id_estado?: number };

@Injectable({ providedIn: 'root' })
export class RecetasApiService extends CrudApi<Receta, CreateRecetaDto, UpdateRecetaDto> {
  protected override readonly resourcePath = 'recetas';
}
