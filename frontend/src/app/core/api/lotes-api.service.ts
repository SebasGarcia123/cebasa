import { Injectable } from '@angular/core';
import { CrudApi } from './crud-api.service';
import { Lote } from '../models/lote.model';
import { components } from './schema';

type CreateLoteDto = components['schemas']['CreateLoteDto'];
// id_estado no está en el alta (arranca Activo), pero sí se puede
// editar después entre Activo/Anulado.
type UpdateLoteDto = Partial<CreateLoteDto> & { id_estado?: number };

@Injectable({ providedIn: 'root' })
export class LotesApiService extends CrudApi<Lote, CreateLoteDto, UpdateLoteDto> {
  protected override readonly resourcePath = 'lotes';
}
