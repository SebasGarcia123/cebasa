import { Injectable } from '@angular/core';
import { CrudApi } from './crud-api.service';
import { MovimientoInsumo } from '../models/movimiento-insumo.model';
import { components } from './schema';

type CreateMovimientoInsumoDto = components['schemas']['CreateMovimientoInsumoDto'];
// id_estado no está en el alta (arranca Activo), pero sí se puede
// editar después entre Activo/Anulado.
type UpdateMovimientoInsumoDto = Partial<CreateMovimientoInsumoDto> & { id_estado?: number };

@Injectable({ providedIn: 'root' })
export class MovimientoInsumoApiService extends CrudApi<MovimientoInsumo, CreateMovimientoInsumoDto, UpdateMovimientoInsumoDto> {
  protected override readonly resourcePath = 'movimientos-insumo';
}
