import { Injectable } from '@angular/core';
import { CrudApi } from './crud-api.service';
import { PedidoInsumos } from '../models/pedido-insumos.model';
import { components } from './schema';

type CreatePedidoInsumosDto = components['schemas']['CreatePedidoInsumosDto'];
// id_estado no está en el alta (arranca Activo), pero sí se puede
// editar después entre Activo/Anulado.
type UpdatePedidoInsumosDto = Partial<CreatePedidoInsumosDto> & { id_estado?: number };

@Injectable({ providedIn: 'root' })
export class PedidoInsumosApiService extends CrudApi<PedidoInsumos, CreatePedidoInsumosDto, UpdatePedidoInsumosDto> {
  protected override readonly resourcePath = 'pedidos-insumos';
}
