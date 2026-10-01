import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CrudApi } from './crud-api.service';
import { DevolucionInsumos } from '../models/devolucion-insumos.model';
import { components } from './schema';
import { environment } from '../../../environments/environment';

type CreateDevolucionInsumosDto = components['schemas']['CreateDevolucionInsumosDto'];
type UpdateDevolucionInsumosDto = components['schemas']['UpdateDevolucionInsumosDto'];
type AprobarDevolucionInsumosDto = components['schemas']['AprobarDevolucionInsumosDto'];
type RechazarDevolucionInsumosDto = components['schemas']['RechazarDevolucionInsumosDto'];

export interface FiltrosDevolucionInsumos {
  desde?: string;
  hasta?: string;
  verTodos?: boolean;
}

@Injectable({ providedIn: 'root' })
export class DevolucionInsumosApiService extends CrudApi<DevolucionInsumos, CreateDevolucionInsumosDto, UpdateDevolucionInsumosDto> {
  protected override readonly resourcePath = 'devoluciones-insumos';
  private readonly actionsBaseUrl = `${environment.apiUrl}/devoluciones-insumos`;

  // Pantalla de Producción: sus propias devoluciones, con filtros.
  listParaProduccion(filtros: FiltrosDevolucionInsumos): Observable<DevolucionInsumos[]> {
    const params: Record<string, string> = {};
    if (filtros.desde) params['desde'] = filtros.desde;
    if (filtros.hasta) params['hasta'] = filtros.hasta;
    if (filtros.verTodos) params['verTodos'] = 'true';
    return this.http.get<DevolucionInsumos[]>(this.actionsBaseUrl, { params });
  }

  // Pantalla del jefe de Logística: misma vista, con los mismos filtros.
  listParaLogistica(filtros: FiltrosDevolucionInsumos): Observable<DevolucionInsumos[]> {
    const params: Record<string, string> = {};
    if (filtros.desde) params['desde'] = filtros.desde;
    if (filtros.hasta) params['hasta'] = filtros.hasta;
    if (filtros.verTodos) params['verTodos'] = 'true';
    return this.http.get<DevolucionInsumos[]>(`${this.actionsBaseUrl}/para-logistica`, { params });
  }

  aprobar(id: number, dto: AprobarDevolucionInsumosDto = {}): Observable<DevolucionInsumos> {
    return this.http.post<DevolucionInsumos>(`${this.actionsBaseUrl}/${id}/aprobar`, dto);
  }

  rechazar(id: number, dto: RechazarDevolucionInsumosDto): Observable<DevolucionInsumos> {
    return this.http.post<DevolucionInsumos>(`${this.actionsBaseUrl}/${id}/rechazar`, dto);
  }
}
