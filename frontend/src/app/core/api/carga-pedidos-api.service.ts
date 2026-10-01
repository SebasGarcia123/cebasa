import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CargaPallet, PedidoACargar } from '../models/carga-pedido.model';

@Injectable({ providedIn: 'root' })
export class CargaPedidosApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/carga-pedidos`;

  pedidosDelDia(fecha: string): Observable<PedidoACargar[]> {
    return this.http.get<PedidoACargar[]>(this.baseUrl, { params: { fecha } });
  }

  pallets(idPedido: number): Observable<CargaPallet[]> {
    return this.http.get<CargaPallet[]>(`${this.baseUrl}/${idPedido}/pallets`);
  }

  iniciar(idPedido: number, sugerirOrden: boolean): Observable<CargaPallet[]> {
    return this.http.post<CargaPallet[]>(`${this.baseUrl}/${idPedido}/iniciar`, { sugerir_orden: sugerirOrden });
  }

  cargarPallet(idCargaPallet: number): Observable<{ pallets: CargaPallet[]; pedido_completo: boolean }> {
    return this.http.post<{ pallets: CargaPallet[]; pedido_completo: boolean }>(
      `${this.baseUrl}/pallets/${idCargaPallet}/cargar`,
      {},
    );
  }
}
