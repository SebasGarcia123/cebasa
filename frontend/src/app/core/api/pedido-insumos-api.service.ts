import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CrudApi } from './crud-api.service';
import { PedidoInsumos } from '../models/pedido-insumos.model';
import { components } from './schema';
import { environment } from '../../../environments/environment';

type CreatePedidoInsumosDto = components['schemas']['CreatePedidoInsumosDto'];
type UpdatePedidoInsumosDto = components['schemas']['UpdatePedidoInsumosDto'];
type CumplirPedidoInsumosDto = components['schemas']['CumplirPedidoInsumosDto'];
type ParaRevisarPedidoInsumosDto = components['schemas']['ParaRevisarPedidoInsumosDto'];
type RecibirPedidoInsumosDto = components['schemas']['RecibirPedidoInsumosDto'];

export interface FiltrosPedidoInsumos {
  desde?: string;
  hasta?: string;
  verTodos?: boolean;
}

@Injectable({ providedIn: 'root' })
export class PedidoInsumosApiService extends CrudApi<PedidoInsumos, CreatePedidoInsumosDto, UpdatePedidoInsumosDto> {
  protected override readonly resourcePath = 'pedidos-insumos';
  private readonly actionsBaseUrl = `${environment.apiUrl}/pedidos-insumos`;

  // Pantalla de Producción: sus propios pedidos, con filtros.
  listParaProduccion(filtros: FiltrosPedidoInsumos): Observable<PedidoInsumos[]> {
    const params: Record<string, string> = {};
    if (filtros.desde) params['desde'] = filtros.desde;
    if (filtros.hasta) params['hasta'] = filtros.hasta;
    if (filtros.verTodos) params['verTodos'] = 'true';
    return this.http.get<PedidoInsumos[]>(this.actionsBaseUrl, { params });
  }

  // Pantalla de Logística: solo lo accionable (Pendiente/Rechazado).
  listParaLogistica(): Observable<PedidoInsumos[]> {
    return this.http.get<PedidoInsumos[]>(`${this.actionsBaseUrl}/para-logistica`);
  }

  anular(id: number): Observable<PedidoInsumos> {
    return this.http.post<PedidoInsumos>(`${this.actionsBaseUrl}/${id}/anular`, {});
  }

  cumplir(id: number, dto: CumplirPedidoInsumosDto): Observable<PedidoInsumos> {
    return this.http.post<PedidoInsumos>(`${this.actionsBaseUrl}/${id}/cumplir`, dto);
  }

  recibir(id: number, dto: RecibirPedidoInsumosDto = {}): Observable<PedidoInsumos> {
    return this.http.post<PedidoInsumos>(`${this.actionsBaseUrl}/${id}/recibir`, dto);
  }

  paraRevisar(id: number, dto: ParaRevisarPedidoInsumosDto): Observable<PedidoInsumos> {
    return this.http.post<PedidoInsumos>(`${this.actionsBaseUrl}/${id}/para-revisar`, dto);
  }
}
