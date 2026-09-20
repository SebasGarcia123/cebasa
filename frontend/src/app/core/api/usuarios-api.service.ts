import { Injectable } from '@angular/core';
import { CrudApi } from './crud-api.service';
import { Usuario } from '../models/usuario.model';
import { components } from './schema';

type CreateUsuarioDto = components['schemas']['CreateUsuarioDto'];

@Injectable({ providedIn: 'root' })
export class UsuariosApiService extends CrudApi<Usuario, CreateUsuarioDto> {
  protected override readonly resourcePath = 'usuarios';
}
