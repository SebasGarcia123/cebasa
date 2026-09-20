import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CompraDetalle } from '../models/compra-detalle.model';

export interface CompraDetalleDto {
  id_insumo: number;
  id_requerimiento_detalle: number;
  cantidad: number;
  precio_compra: number;
}

@Injectable({ providedIn: 'root' })
export class CompraDetalleApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  private base(idCompra: number): string {
    return `${this.baseUrl}/compras/${idCompra}/detalle`;
  }

  list(idCompra: number): Observable<CompraDetalle[]> {
    return this.http.get<CompraDetalle[]>(this.base(idCompra));
  }

  create(idCompra: number, dto: CompraDetalleDto): Observable<CompraDetalle> {
    return this.http.post<CompraDetalle>(this.base(idCompra), dto);
  }

  update(idCompra: number, idDetalle: number, dto: Partial<CompraDetalleDto>): Observable<CompraDetalle> {
    return this.http.patch<CompraDetalle>(`${this.base(idCompra)}/${idDetalle}`, dto);
  }

  remove(idCompra: number, idDetalle: number): Observable<void> {
    return this.http.delete<void>(`${this.base(idCompra)}/${idDetalle}`);
  }
}
