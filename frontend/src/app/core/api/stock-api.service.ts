import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { StockInsumo, StockProducto } from '../models/stock-item.model';

export interface AjustarStockDto {
  cantidad_nueva: number;
  motivo: string;
}

@Injectable({ providedIn: 'root' })
export class StockApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/stock`;

  listInsumos(): Observable<StockInsumo[]> {
    return this.http.get<StockInsumo[]>(`${this.baseUrl}/insumos`);
  }

  listProductos(): Observable<StockProducto[]> {
    return this.http.get<StockProducto[]>(`${this.baseUrl}/productos`);
  }

  ajustarInsumo(id: number, dto: AjustarStockDto): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/insumos/${id}/ajuste`, dto);
  }

  ajustarProducto(id: number, dto: AjustarStockDto): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/productos/${id}/ajuste`, dto);
  }
}
