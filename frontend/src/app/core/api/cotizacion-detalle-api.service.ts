import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CotizacionDetalle } from '../models/cotizacion-detalle.model';

export interface CotizacionDetalleDto {
  id_requerimiento_detalle: number;
  cantidad: number;
  precio_cotizado: number;
}

@Injectable({ providedIn: 'root' })
export class CotizacionDetalleApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  private base(idCotizacion: number): string {
    return `${this.baseUrl}/cotizaciones/${idCotizacion}/detalle`;
  }

  list(idCotizacion: number): Observable<CotizacionDetalle[]> {
    return this.http.get<CotizacionDetalle[]>(this.base(idCotizacion));
  }

  create(idCotizacion: number, dto: CotizacionDetalleDto): Observable<CotizacionDetalle> {
    return this.http.post<CotizacionDetalle>(this.base(idCotizacion), dto);
  }

  update(
    idCotizacion: number,
    idDetalle: number,
    dto: Partial<CotizacionDetalleDto>,
  ): Observable<CotizacionDetalle> {
    return this.http.patch<CotizacionDetalle>(`${this.base(idCotizacion)}/${idDetalle}`, dto);
  }

  remove(idCotizacion: number, idDetalle: number): Observable<void> {
    return this.http.delete<void>(`${this.base(idCotizacion)}/${idDetalle}`);
  }
}
