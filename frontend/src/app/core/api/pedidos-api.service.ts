import { Injectable } from '@angular/core';
import { CrudApi } from './crud-api.service';
import { Pedido } from '../models/pedido.model';
import { components } from './schema';

type CreatePedidoDto = components['schemas']['CreatePedidoDto'];

@Injectable({ providedIn: 'root' })
export class PedidosApiService extends CrudApi<Pedido, CreatePedidoDto> {
  protected override readonly resourcePath = 'pedidos';
}
