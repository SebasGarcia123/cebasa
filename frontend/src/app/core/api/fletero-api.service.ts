import { Injectable } from '@angular/core';
import { CrudApi } from './crud-api.service';
import { Fletero } from '../models/fletero.model';
import { components } from './schema';

type CreateFleteroDto = components['schemas']['CreateFleteroDto'];

@Injectable({ providedIn: 'root' })
export class FleteroApiService extends CrudApi<Fletero, CreateFleteroDto> {
  protected override readonly resourcePath = 'fletero';
}
