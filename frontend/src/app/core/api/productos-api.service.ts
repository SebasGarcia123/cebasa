import { Injectable } from '@angular/core';
import { CrudApi } from './crud-api.service';
import { Producto } from '../models/producto.model';
import { components } from './schema';

type CreateProductoDto = components['schemas']['CreateProductoDto'];

@Injectable({ providedIn: 'root' })
export class ProductosApiService extends CrudApi<Producto, CreateProductoDto> {
  protected override readonly resourcePath = 'productos';
}
