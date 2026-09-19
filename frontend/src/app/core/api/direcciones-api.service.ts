import { Injectable } from '@angular/core';
import { CrudApi } from './crud-api.service';
import { Direccion } from '../models/direccion.model';
import { components } from './schema';

type CreateDireccionDto = components['schemas']['CreateDireccionDto'];

@Injectable({ providedIn: 'root' })
export class DireccionesApiService extends CrudApi<Direccion, CreateDireccionDto> {
  protected override readonly resourcePath = 'direcciones';
}
