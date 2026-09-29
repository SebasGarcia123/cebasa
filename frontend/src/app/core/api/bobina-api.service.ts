import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Bobina } from '../models/bobina.model';
import { components } from './schema';

export type CreateBobinaDto = components['schemas']['CreateBobinaDto'];

@Injectable({ providedIn: 'root' })
export class BobinaApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  private base(idLote: number): string {
    return `${this.baseUrl}/lotes-prod/${idLote}/bobinas`;
  }

  list(idLote: number): Observable<Bobina[]> {
    return this.http.get<Bobina[]>(this.base(idLote));
  }

  create(idLote: number, dto: CreateBobinaDto): Observable<Bobina> {
    return this.http.post<Bobina>(this.base(idLote), dto);
  }

  remove(idLote: number, idBobina: number): Observable<void> {
    return this.http.delete<void>(`${this.base(idLote)}/${idBobina}`);
  }

  rotulo(idLote: number, idBobina: number): Observable<Blob> {
    return this.http.get(`${this.base(idLote)}/${idBobina}/rotulo`, { responseType: 'blob' });
  }
}
