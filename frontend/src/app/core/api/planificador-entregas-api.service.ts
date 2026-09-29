import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TableroPlanificador } from '../models/planificador-entregas.model';

export interface OrdenPedidoDto {
  id_pedido: number;
  orden_planificador: number;
}

@Injectable({ providedIn: 'root' })
export class PlanificadorEntregasApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/planificador-entregas`;

  tablero(): Observable<TableroPlanificador> {
    return this.http.get<TableroPlanificador>(this.baseUrl);
  }

  asignarFechaSalida(idPedido: number, fechaSalida: string | null): Observable<unknown> {
    return this.http.patch(`${this.baseUrl}/pedidos/${idPedido}/fecha-salida`, { fecha_salida: fechaSalida });
  }

  reordenar(ordenes: OrdenPedidoDto[]): Observable<unknown> {
    return this.http.patch(`${this.baseUrl}/orden`, { ordenes });
  }
}
