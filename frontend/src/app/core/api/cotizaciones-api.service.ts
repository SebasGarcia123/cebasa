import { Injectable } from '@angular/core';
import { CrudApi } from './crud-api.service';
import { Cotizacion } from '../models/cotizacion.model';
import { components } from './schema';

type CreateCotizacionDto = components['schemas']['CreateCotizacionDto'];

@Injectable({ providedIn: 'root' })
export class CotizacionesApiService extends CrudApi<Cotizacion, CreateCotizacionDto> {
  protected override readonly resourcePath = 'cotizaciones';
}
