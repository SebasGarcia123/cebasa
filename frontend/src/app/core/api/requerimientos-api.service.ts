import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CrudApi } from './crud-api.service';
import { Requerimiento } from '../models/requerimiento.model';
import { Compra } from '../models/compra.model';
import { components } from './schema';

type CreateRequerimientoDto = components['schemas']['CreateRequerimientoDto'];
export type GenerarOcDto = components['schemas']['GenerarOcDto'];

@Injectable({ providedIn: 'root' })
export class RequerimientosApiService extends CrudApi<Requerimiento, CreateRequerimientoDto> {
  protected override readonly resourcePath = 'requerimientos';

  // Compras carga el precio por línea + adjunta el comprobante: esto
  // genera una nueva orden de compra y marca el requerimiento Procesado.
  generarOc(id: number, dto: GenerarOcDto): Observable<Compra> {
    return this.http.post<Compra>(`${environment.apiUrl}/requerimientos/${id}/generar-oc`, dto);
  }
}
