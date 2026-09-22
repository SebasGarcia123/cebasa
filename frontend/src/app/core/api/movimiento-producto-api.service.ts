import { Injectable } from '@angular/core';
import { CrudApi } from './crud-api.service';
import { MovimientoProducto } from '../models/movimiento-producto.model';
import { components } from './schema';

type CreateMovimientoProductoDto = components['schemas']['CreateMovimientoProductoDto'];
// id_estado no está en el alta (arranca Activo), pero sí se puede
// editar después entre Activo/Anulado.
type UpdateMovimientoProductoDto = Partial<CreateMovimientoProductoDto> & { id_estado?: number };

@Injectable({ providedIn: 'root' })
export class MovimientoProductoApiService extends CrudApi<MovimientoProducto, CreateMovimientoProductoDto, UpdateMovimientoProductoDto> {
  protected override readonly resourcePath = 'movimientos-producto';
}
