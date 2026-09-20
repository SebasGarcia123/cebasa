import { Injectable } from '@angular/core';
import { CrudApi } from './crud-api.service';
import { MovimientoInsumo } from '../models/movimiento-insumo.model';
import { components } from './schema';

type CreateMovimientoInsumoDto = components['schemas']['CreateMovimientoInsumoDto'];

@Injectable({ providedIn: 'root' })
export class MovimientoInsumoApiService extends CrudApi<MovimientoInsumo, CreateMovimientoInsumoDto> {
  protected override readonly resourcePath = 'movimientos-insumo';
}
