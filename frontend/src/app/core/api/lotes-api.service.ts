import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CrudApi } from './crud-api.service';
import { Lote } from '../models/lote.model';
import { components } from './schema';
import { environment } from '../../../environments/environment';

type CreateLoteDto = components['schemas']['CreateLoteDto'];
// El estado ya no se edita a mano: lo maneja el flujo
// despachar/aprobar/rechazar (ver LotesService en el backend).
type UpdateLoteDto = Partial<CreateLoteDto>;
type RechazarLoteDto = components['schemas']['RechazarLoteDto'];

@Injectable({ providedIn: 'root' })
export class LotesApiService extends CrudApi<Lote, CreateLoteDto, UpdateLoteDto> {
  protected override readonly resourcePath = 'lotes';
  private readonly actionsBaseUrl = `${environment.apiUrl}/lotes`;

  despachar(id: number): Observable<Lote> {
    return this.http.post<Lote>(`${this.actionsBaseUrl}/${id}/despachar`, {});
  }

  aprobar(id: number): Observable<Lote> {
    return this.http.post<Lote>(`${this.actionsBaseUrl}/${id}/aprobar`, {});
  }

  rechazar(id: number, dto: RechazarLoteDto): Observable<Lote> {
    return this.http.post<Lote>(`${this.actionsBaseUrl}/${id}/rechazar`, dto);
  }

  pdf(id: number): Observable<Blob> {
    return this.http.get(`${this.actionsBaseUrl}/${id}/pdf`, { responseType: 'blob' });
  }
}
