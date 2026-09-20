import { Injectable } from '@angular/core';
import { CrudApi } from './crud-api.service';
import { PedidoInsumos } from '../models/pedido-insumos.model';
import { components } from './schema';

type CreatePedidoInsumosDto = components['schemas']['CreatePedidoInsumosDto'];

@Injectable({ providedIn: 'root' })
export class PedidoInsumosApiService extends CrudApi<PedidoInsumos, CreatePedidoInsumosDto> {
  protected override readonly resourcePath = 'pedidos-insumos';
}
