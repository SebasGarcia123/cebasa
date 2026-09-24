import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CrudApi } from './crud-api.service';
import { Pedido } from '../models/pedido.model';
import { components } from './schema';
import { environment } from '../../../environments/environment';

type CreatePedidoDto = components['schemas']['CreatePedidoDto'];
// El estado ya no se edita a mano: lo maneja el flujo
// facturar/despachar/anular (ver PedidosService en el backend).
type UpdatePedidoDto = Partial<CreatePedidoDto>;
type DespacharPedidoDto = components['schemas']['DespacharPedidoDto'];
type AnularPedidoDto = components['schemas']['AnularPedidoDto'];

@Injectable({ providedIn: 'root' })
export class PedidosApiService extends CrudApi<Pedido, CreatePedidoDto, UpdatePedidoDto> {
  protected override readonly resourcePath = 'pedidos';
  private readonly actionsBaseUrl = `${environment.apiUrl}/pedidos`;

  facturar(id: number): Observable<Pedido> {
    return this.http.post<Pedido>(`${this.actionsBaseUrl}/${id}/facturar`, {});
  }

  anular(id: number, dto: AnularPedidoDto): Observable<Pedido> {
    return this.http.post<Pedido>(`${this.actionsBaseUrl}/${id}/anular`, dto);
  }

  // Devuelve el PDF del remito: dispara la descarga/registro de stock
  // (primera vez) o simplemente lo reimprime si ya estaba despachado.
  despachar(id: number, dto: DespacharPedidoDto): Observable<Blob> {
    return this.http.post(`${this.actionsBaseUrl}/${id}/despachar`, dto, { responseType: 'blob' });
  }

  remito(id: number): Observable<Blob> {
    return this.http.get(`${this.actionsBaseUrl}/${id}/remito`, { responseType: 'blob' });
  }
}
