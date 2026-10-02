import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CrudApi } from './crud-api.service';
import { Cliente } from '../models/cliente.model';
import { Pedido } from '../models/pedido.model';
import { components } from './schema';
import { environment } from '../../../environments/environment';

type CreateClienteDto = components['schemas']['CreateClienteDto'];
// No se usa components['schemas']['UpdateClienteDto'] directo: el plugin
// de Swagger no infiere los campos heredados de PartialType(CreateClienteDto)
// (solo ve id_estado, que se declara aparte). El shape real que acepta el
// backend es CreateClienteDto parcial + id_estado.
type UpdateClienteDto = Partial<CreateClienteDto> & { id_estado?: number };

@Injectable({ providedIn: 'root' })
export class ClientesApiService extends CrudApi<Cliente, CreateClienteDto, UpdateClienteDto> {
  protected override readonly resourcePath = 'clientes';

  // Pedidos del cliente con sus ítems, para la pantalla de detalle. No
  // usa /pedidos porque ese endpoint exige el permiso de otra pantalla.
  pedidos(idCliente: number): Observable<Pedido[]> {
    return this.http.get<Pedido[]>(`${environment.apiUrl}/clientes/${idCliente}/pedidos`);
  }
}
