import { Injectable } from '@angular/core';
import { CrudApi } from './crud-api.service';
import { Receta } from '../models/receta.model';
import { components } from './schema';

type CreateRecetaDto = components['schemas']['CreateRecetaDto'];

@Injectable({ providedIn: 'root' })
export class RecetasApiService extends CrudApi<Receta, CreateRecetaDto> {
  protected override readonly resourcePath = 'recetas';
}
