import { Injectable } from '@angular/core';
import { CrudApi } from './crud-api.service';
import { MovimientoProducto } from '../models/movimiento-producto.model';
import { components } from './schema';

type CreateMovimientoProductoDto = components['schemas']['CreateMovimientoProductoDto'];

@Injectable({ providedIn: 'root' })
export class MovimientoProductoApiService extends CrudApi<MovimientoProducto, CreateMovimientoProductoDto> {
  protected override readonly resourcePath = 'movimientos-producto';
}
