import { Injectable } from '@angular/core';
import { CrudApi } from './crud-api.service';
import { TipoMovimiento } from '../models/tipo-movimiento.model';
import { components } from './schema';

type CreateTipoMovimientoDto = components['schemas']['CreateTipoMovimientoDto'];
// id_estado no está en el alta (arranca Activo), pero sí se puede
// editar después entre Activo/Anulado.
type UpdateTipoMovimientoDto = Partial<CreateTipoMovimientoDto> & { id_estado?: number };

@Injectable({ providedIn: 'root' })
export class TipoMovimientoApiService extends CrudApi<TipoMovimiento, CreateTipoMovimientoDto, UpdateTipoMovimientoDto> {
  protected override readonly resourcePath = 'tipo-movimiento';
}
