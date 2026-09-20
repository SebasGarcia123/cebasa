import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Camion } from '../models/camion.model';

export interface CamionDto {
  marca?: string;
  modelo?: string;
  dominio_chasis: string;
  dominio_semi?: string;
}

@Injectable({ providedIn: 'root' })
export class CamionApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  private base(idTransporte: number): string {
    return `${this.baseUrl}/transporte/${idTransporte}/camiones`;
  }

  list(idTransporte: number): Observable<Camion[]> {
    return this.http.get<Camion[]>(this.base(idTransporte));
  }

  create(idTransporte: number, dto: CamionDto): Observable<Camion> {
    return this.http.post<Camion>(this.base(idTransporte), dto);
  }

  update(idTransporte: number, idCamion: number, dto: Partial<CamionDto>): Observable<Camion> {
    return this.http.patch<Camion>(`${this.base(idTransporte)}/${idCamion}`, dto);
  }

  remove(idTransporte: number, idCamion: number): Observable<void> {
    return this.http.delete<void>(`${this.base(idTransporte)}/${idCamion}`);
  }
}
