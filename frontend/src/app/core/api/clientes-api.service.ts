import { Injectable } from '@angular/core';
import { CrudApi } from './crud-api.service';
import { Cliente } from '../models/cliente.model';
import { components } from './schema';

type CreateClienteDto = components['schemas']['CreateClienteDto'];

@Injectable({ providedIn: 'root' })
export class ClientesApiService extends CrudApi<Cliente, CreateClienteDto> {
  protected override readonly resourcePath = 'clientes';
}
