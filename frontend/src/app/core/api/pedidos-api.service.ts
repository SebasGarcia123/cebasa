import { Injectable } from '@angular/core';
import { CrudApi } from './crud-api.service';
import { Pedido } from '../models/pedido.model';
import { components } from './schema';

type CreatePedidoDto = components['schemas']['CreatePedidoDto'];
// UpdatePedidoDto en el schema generado no trae los campos heredados de
// PartialType (limitación del plugin de Swagger con mapped-types): el
// shape real que acepta el backend es CreatePedidoDto parcial, más
// id_estado (no está en el alta: un pedido nuevo siempre arranca
// Activo, pero sí se puede editar después entre Activo/Anulado).
type UpdatePedidoDto = Partial<CreatePedidoDto> & { id_estado?: number };

@Injectable({ providedIn: 'root' })
export class PedidosApiService extends CrudApi<Pedido, CreatePedidoDto, UpdatePedidoDto> {
  protected override readonly resourcePath = 'pedidos';
}
