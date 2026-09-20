import { Injectable } from '@angular/core';
import { CrudApi } from './crud-api.service';
import { Insumo } from '../models/insumo.model';
import { components } from './schema';

type CreateInsumoDto = components['schemas']['CreateInsumoDto'];

@Injectable({ providedIn: 'root' })
export class InsumosApiService extends CrudApi<Insumo, CreateInsumoDto> {
  protected override readonly resourcePath = 'insumos';
}
