import { Injectable } from '@angular/core';
import { CrudApi } from './crud-api.service';
import { Linea } from '../models/linea.model';
import { components } from './schema';

type CreateLineaDto = components['schemas']['CreateLineaDto'];

@Injectable({ providedIn: 'root' })
export class LineasApiService extends CrudApi<Linea, CreateLineaDto> {
  protected override readonly resourcePath = 'lineas';
}
