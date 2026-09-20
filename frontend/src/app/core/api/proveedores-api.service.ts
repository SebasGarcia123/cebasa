import { Injectable } from '@angular/core';
import { CrudApi } from './crud-api.service';
import { Proveedor } from '../models/proveedor.model';
import { components } from './schema';

type CreateProveedorDto = components['schemas']['CreateProveedorDto'];
// UpdateProveedorDto en el schema generado no trae los campos heredados
// de PartialType (limitación del plugin de Swagger con mapped-types): el
// shape real que acepta el backend es CreateProveedorDto parcial, más
// id_estado (no está en el alta: un proveedor nuevo siempre arranca
// Activo, pero sí se puede editar después entre Activo/Anulado).
type UpdateProveedorDto = Partial<CreateProveedorDto> & { id_estado?: number };

@Injectable({ providedIn: 'root' })
export class ProveedoresApiService extends CrudApi<Proveedor, CreateProveedorDto, UpdateProveedorDto> {
  protected override readonly resourcePath = 'proveedores';
}
