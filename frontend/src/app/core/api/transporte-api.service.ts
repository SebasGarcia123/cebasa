import { Injectable } from '@angular/core';
import { CrudApi } from './crud-api.service';
import { Transporte } from '../models/transporte.model';
import { components } from './schema';

type CreateTransporteDto = components['schemas']['CreateTransporteDto'];
// id_estado no está en el alta (arranca Activo), pero sí se puede
// editar después entre Activo/Anulado.
type UpdateTransporteDto = Partial<CreateTransporteDto> & { id_estado?: number };

@Injectable({ providedIn: 'root' })
export class TransporteApiService extends CrudApi<Transporte, CreateTransporteDto, UpdateTransporteDto> {
  protected override readonly resourcePath = 'transporte';
}
