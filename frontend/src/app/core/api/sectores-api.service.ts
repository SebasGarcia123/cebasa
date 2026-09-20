import { Injectable } from '@angular/core';
import { CrudApi } from './crud-api.service';
import { Sector } from '../models/sector.model';
import { components } from './schema';

type CreateSectorDto = components['schemas']['CreateSectorDto'];

@Injectable({ providedIn: 'root' })
export class SectoresApiService extends CrudApi<Sector, CreateSectorDto> {
  protected override readonly resourcePath = 'sectores';
}
