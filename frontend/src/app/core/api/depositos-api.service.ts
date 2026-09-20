import { Injectable } from '@angular/core';
import { CrudApi } from './crud-api.service';
import { Deposito } from '../models/deposito.model';
import { components } from './schema';

type CreateDepositoDto = components['schemas']['CreateDepositoDto'];

@Injectable({ providedIn: 'root' })
export class DepositosApiService extends CrudApi<Deposito, CreateDepositoDto> {
  protected override readonly resourcePath = 'deposito';
}
