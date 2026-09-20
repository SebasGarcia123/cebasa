import { Injectable } from '@angular/core';
import { CrudApi } from './crud-api.service';
import { Compra } from '../models/compra.model';
import { components } from './schema';

type CreateCompraDto = components['schemas']['CreateCompraDto'];

@Injectable({ providedIn: 'root' })
export class ComprasApiService extends CrudApi<Compra, CreateCompraDto> {
  protected override readonly resourcePath = 'compras';
}
