import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Pallet } from '../models/pallet.model';
import { components } from './schema';

export type CreatePalletDto = components['schemas']['CreatePalletDto'];

@Injectable({ providedIn: 'root' })
export class PalletApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  private base(idLote: number): string {
    return `${this.baseUrl}/lotes-prod/${idLote}/pallets`;
  }

  list(idLote: number): Observable<Pallet[]> {
    return this.http.get<Pallet[]>(this.base(idLote));
  }

  create(idLote: number, dto: CreatePalletDto): Observable<Pallet> {
    return this.http.post<Pallet>(this.base(idLote), dto);
  }

  remove(idLote: number, idPallet: number): Observable<void> {
    return this.http.delete<void>(`${this.base(idLote)}/${idPallet}`);
  }

  rotulo(idLote: number, idPallet: number): Observable<Blob> {
    return this.http.get(`${this.base(idLote)}/${idPallet}/rotulo`, { responseType: 'blob' });
  }
}
