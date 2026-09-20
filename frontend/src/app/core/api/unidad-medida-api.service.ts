import { Injectable } from '@angular/core';
import { CrudApi } from './crud-api.service';
import { UnidadMedida } from '../models/unidad-medida.model';
import { components } from './schema';

type CreateUnidadMedidaDto = components['schemas']['CreateUnidadMedidaDto'];

@Injectable({ providedIn: 'root' })
export class UnidadMedidaApiService extends CrudApi<UnidadMedida, CreateUnidadMedidaDto> {
  protected override readonly resourcePath = 'unidad-medida';
}
