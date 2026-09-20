import { Injectable } from '@angular/core';
import { CrudApi } from './crud-api.service';
import { Proveedor } from '../models/proveedor.model';
import { components } from './schema';

type CreateProveedorDto = components['schemas']['CreateProveedorDto'];

@Injectable({ providedIn: 'root' })
export class ProveedoresApiService extends CrudApi<Proveedor, CreateProveedorDto> {
  protected override readonly resourcePath = 'proveedores';
}
