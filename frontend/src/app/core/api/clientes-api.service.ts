import { Injectable } from '@angular/core';
import { CrudApi } from './crud-api.service';
import { Cliente } from '../models/cliente.model';
import { components } from './schema';

type CreateClienteDto = components['schemas']['CreateClienteDto'];
// No se usa components['schemas']['UpdateClienteDto'] directo: el plugin
// de Swagger no infiere los campos heredados de PartialType(CreateClienteDto)
// (solo ve id_estado, que se declara aparte). El shape real que acepta el
// backend es CreateClienteDto parcial + id_estado.
type UpdateClienteDto = Partial<CreateClienteDto> & { id_estado?: number };

@Injectable({ providedIn: 'root' })
export class ClientesApiService extends CrudApi<Cliente, CreateClienteDto, UpdateClienteDto> {
  protected override readonly resourcePath = 'clientes';
}
