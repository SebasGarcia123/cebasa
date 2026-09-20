import { Injectable } from '@angular/core';
import { CrudApi } from './crud-api.service';
import { Permiso } from '../models/permiso.model';
import { components } from './schema';

type CreatePermisoDto = components['schemas']['CreatePermisoDto'];

@Injectable({ providedIn: 'root' })
export class PermisosApiService extends CrudApi<Permiso, CreatePermisoDto> {
  protected override readonly resourcePath = 'permisos';
}
