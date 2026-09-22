import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CrudApi } from './crud-api.service';
import { LoteProd } from '../models/lote-prod.model';
import { components } from './schema';
import { environment } from '../../../environments/environment';

type CreateLoteProdDto = components['schemas']['CreateLoteProdDto'];
// El estado ya no se edita a mano: lo maneja el flujo de aprobación
// (ver LoteProdService en el backend), por eso no se agrega id_estado
// acá como se hace en las demás entidades con estado Activo/Anulado.
type UpdateLoteProdDto = Partial<CreateLoteProdDto>;
type RechazarLoteProdDto = components['schemas']['RechazarLoteProdDto'];

@Injectable({ providedIn: 'root' })
export class LoteProdApiService extends CrudApi<LoteProd, CreateLoteProdDto, UpdateLoteProdDto> {
  protected override readonly resourcePath = 'lotes-prod';
  private readonly actionsBaseUrl = `${environment.apiUrl}/lotes-prod`;

  aprobar(id: number): Observable<LoteProd> {
    return this.http.post<LoteProd>(`${this.actionsBaseUrl}/${id}/aprobar`, {});
  }

  rechazar(id: number, dto: RechazarLoteProdDto): Observable<LoteProd> {
    return this.http.post<LoteProd>(`${this.actionsBaseUrl}/${id}/rechazar`, dto);
  }
}
