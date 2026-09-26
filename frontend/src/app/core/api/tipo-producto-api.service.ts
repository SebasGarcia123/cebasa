import { Injectable } from '@angular/core';
import { CrudApi } from './crud-api.service';
import { TipoProducto } from '../models/tipo-producto.model';
import { components } from './schema';

type CreateTipoProductoDto = components['schemas']['CreateTipoProductoDto'];

@Injectable({ providedIn: 'root' })
export class TipoProductoApiService extends CrudApi<TipoProducto, CreateTipoProductoDto> {
  protected override readonly resourcePath = 'tipo-producto';
}
