import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { StockInsumo, StockProducto } from '../models/stock-item.model';

export interface AjustarStockDto {
  id_deposito: number;
  cantidad_nueva: number;
  motivo: string;
}

@Injectable({ providedIn: 'root' })
export class StockApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/stock`;

  // idDeposito ausente: stock total (todos los depósitos). Con
  // idDeposito: lo que hay puntualmente en ese depósito.
  listInsumos(idDeposito?: number): Observable<StockInsumo[]> {
    const params = idDeposito ? new HttpParams().set('idDeposito', idDeposito) : undefined;
    return this.http.get<StockInsumo[]>(`${this.baseUrl}/insumos`, { params });
  }

  listProductos(idDeposito?: number): Observable<StockProducto[]> {
    const params = idDeposito ? new HttpParams().set('idDeposito', idDeposito) : undefined;
    return this.http.get<StockProducto[]>(`${this.baseUrl}/productos`, { params });
  }

  ajustarInsumo(id: number, dto: AjustarStockDto): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/insumos/${id}/ajuste`, dto);
  }

  ajustarProducto(id: number, dto: AjustarStockDto): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/productos/${id}/ajuste`, dto);
  }
}
