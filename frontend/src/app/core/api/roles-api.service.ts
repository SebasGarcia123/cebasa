import { Injectable } from '@angular/core';
import { CrudApi } from './crud-api.service';
import { Rol } from '../models/rol.model';
import { components } from './schema';

type CreateRolDto = components['schemas']['CreateRolDto'];

@Injectable({ providedIn: 'root' })
export class RolesApiService extends CrudApi<Rol, CreateRolDto> {
  protected override readonly resourcePath = 'roles';
}
