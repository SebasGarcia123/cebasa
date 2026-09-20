import { Injectable } from '@angular/core';
import { CrudApi } from './crud-api.service';
import { Usuario } from '../models/usuario.model';
import { components } from './schema';

type CreateUsuarioDto = components['schemas']['CreateUsuarioDto'];
// UpdateUsuarioDto en el schema generado no trae los campos heredados de
// PartialType (limitación del plugin de Swagger con mapped-types) — el
// shape real que acepta el backend es CreateUsuarioDto parcial, con email
// admitiendo null para poder borrarlo, más id_estado (no está en el alta:
// un usuario nuevo siempre arranca Activo, pero sí se puede editar
// después entre Activo/Cancelado).
type UpdateUsuarioDto = Partial<Omit<CreateUsuarioDto, 'email'>> & {
  email?: string | null;
  id_estado?: number;
};

@Injectable({ providedIn: 'root' })
export class UsuariosApiService extends CrudApi<Usuario, CreateUsuarioDto, UpdateUsuarioDto> {
  protected override readonly resourcePath = 'usuarios';
}
