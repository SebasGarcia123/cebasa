import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DiaNoLaborable } from '../models/dia-no-laborable.model';

export interface CreateDiaNoLaborableDto {
  fecha: string;
  motivo: string;
}

@Injectable({ providedIn: 'root' })
export class DiaNoLaborableApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/planes-produccion/dias-no-laborables`;

  create(dto: CreateDiaNoLaborableDto): Observable<DiaNoLaborable> {
    return this.http.post<DiaNoLaborable>(this.baseUrl, dto);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
