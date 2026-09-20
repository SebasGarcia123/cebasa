import { Injectable } from '@angular/core';
import { CrudApi } from './crud-api.service';
import { Transporte } from '../models/transporte.model';
import { components } from './schema';

type CreateTransporteDto = components['schemas']['CreateTransporteDto'];

@Injectable({ providedIn: 'root' })
export class TransporteApiService extends CrudApi<Transporte, CreateTransporteDto> {
  protected override readonly resourcePath = 'transporte';
}
