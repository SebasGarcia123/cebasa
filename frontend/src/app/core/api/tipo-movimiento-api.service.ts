import { Injectable } from '@angular/core';
import { CrudApi } from './crud-api.service';
import { TipoMovimiento } from '../models/tipo-movimiento.model';
import { components } from './schema';

type CreateTipoMovimientoDto = components['schemas']['CreateTipoMovimientoDto'];

@Injectable({ providedIn: 'root' })
export class TipoMovimientoApiService extends CrudApi<TipoMovimiento, CreateTipoMovimientoDto> {
  protected override readonly resourcePath = 'tipo-movimiento';
}
