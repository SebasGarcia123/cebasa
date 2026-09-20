import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Chofer } from '../models/chofer.model';

export interface ChoferDto {
  nombre_chofer: string;
  dni: string;
  id_direccion: number;
  id_estado: number;
}

@Injectable({ providedIn: 'root' })
export class ChoferApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  private base(idTransporte: number): string {
    return `${this.baseUrl}/transporte/${idTransporte}/choferes`;
  }

  list(idTransporte: number): Observable<Chofer[]> {
    return this.http.get<Chofer[]>(this.base(idTransporte));
  }

  create(idTransporte: number, dto: ChoferDto): Observable<Chofer> {
    return this.http.post<Chofer>(this.base(idTransporte), dto);
  }

  update(idTransporte: number, idChofer: number, dto: Partial<ChoferDto>): Observable<Chofer> {
    return this.http.patch<Chofer>(`${this.base(idTransporte)}/${idChofer}`, dto);
  }

  remove(idTransporte: number, idChofer: number): Observable<void> {
    return this.http.delete<void>(`${this.base(idTransporte)}/${idChofer}`);
  }
}
