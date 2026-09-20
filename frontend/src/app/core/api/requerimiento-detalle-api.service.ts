import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RequerimientoDetalle } from '../models/requerimiento-detalle.model';

export interface RequerimientoDetalleDto {
  id_insumo: number;
  cantidad: number;
}

@Injectable({ providedIn: 'root' })
export class RequerimientoDetalleApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  private base(idRequerimiento: number): string {
    return `${this.baseUrl}/requerimientos/${idRequerimiento}/detalle`;
  }

  list(idRequerimiento: number): Observable<RequerimientoDetalle[]> {
    return this.http.get<RequerimientoDetalle[]>(this.base(idRequerimiento));
  }

  create(idRequerimiento: number, dto: RequerimientoDetalleDto): Observable<RequerimientoDetalle> {
    return this.http.post<RequerimientoDetalle>(this.base(idRequerimiento), dto);
  }

  update(
    idRequerimiento: number,
    idDetalle: number,
    dto: Partial<RequerimientoDetalleDto>,
  ): Observable<RequerimientoDetalle> {
    return this.http.patch<RequerimientoDetalle>(`${this.base(idRequerimiento)}/${idDetalle}`, dto);
  }

  remove(idRequerimiento: number, idDetalle: number): Observable<void> {
    return this.http.delete<void>(`${this.base(idRequerimiento)}/${idDetalle}`);
  }
}
