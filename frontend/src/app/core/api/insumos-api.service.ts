import { Injectable } from '@angular/core';
import { CrudApi } from './crud-api.service';
import { Insumo } from '../models/insumo.model';
import { components } from './schema';

type CreateInsumoDto = components['schemas']['CreateInsumoDto'];
// UpdateInsumoDto en el schema generado no trae los campos heredados de
// PartialType (limitación del plugin de Swagger con mapped-types): el
// shape real que acepta el backend es CreateInsumoDto parcial, más
// id_estado (no está en el alta: un insumo nuevo siempre arranca Activo,
// pero sí se puede editar después entre Activo/Anulado). stock_actual no
// existe en ningún lado: no es un campo editable a mano.
type UpdateInsumoDto = Partial<CreateInsumoDto> & { id_estado?: number };

@Injectable({ providedIn: 'root' })
export class InsumosApiService extends CrudApi<Insumo, CreateInsumoDto, UpdateInsumoDto> {
  protected override readonly resourcePath = 'insumos';
}
