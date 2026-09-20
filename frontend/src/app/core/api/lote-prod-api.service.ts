import { Injectable } from '@angular/core';
import { CrudApi } from './crud-api.service';
import { LoteProd } from '../models/lote-prod.model';
import { components } from './schema';

type CreateLoteProdDto = components['schemas']['CreateLoteProdDto'];

@Injectable({ providedIn: 'root' })
export class LoteProdApiService extends CrudApi<LoteProd, CreateLoteProdDto> {
  protected override readonly resourcePath = 'lotes-prod';
}
