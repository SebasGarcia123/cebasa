import { Injectable } from '@angular/core';
import { CrudApi } from './crud-api.service';
import { LoteProd } from '../models/lote-prod.model';
import { components } from './schema';

type CreateLoteProdDto = components['schemas']['CreateLoteProdDto'];
// id_estado no está en el alta (arranca Activo), pero sí se puede
// editar después entre Activo/Anulado.
type UpdateLoteProdDto = Partial<CreateLoteProdDto> & { id_estado?: number };

@Injectable({ providedIn: 'root' })
export class LoteProdApiService extends CrudApi<LoteProd, CreateLoteProdDto, UpdateLoteProdDto> {
  protected override readonly resourcePath = 'lotes-prod';
}
