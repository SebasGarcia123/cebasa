import { Injectable } from '@angular/core';
import { CrudApi } from './crud-api.service';
import { Deposito } from '../models/deposito.model';
import { components } from './schema';

type CreateDepositoDto = components['schemas']['CreateDepositoDto'];
// UpdateDepositoDto en el schema generado no trae nombre_deposito
// (limitación del plugin de Swagger con mapped-types): el shape real que
// acepta el backend es CreateDepositoDto parcial, más id_estado (no está
// en el alta: un depósito nuevo siempre arranca Activo, pero sí se puede
// editar después entre Activo/Anulado).
type UpdateDepositoDto = Partial<CreateDepositoDto> & { id_estado?: number };

@Injectable({ providedIn: 'root' })
export class DepositosApiService extends CrudApi<Deposito, CreateDepositoDto, UpdateDepositoDto> {
  protected override readonly resourcePath = 'deposito';
}
