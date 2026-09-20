import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CuentaCorriente } from '../models/cuenta-corriente.model';

export interface CuentaCorrienteDto {
  limite_credito?: number;
}

@Injectable({ providedIn: 'root' })
export class CuentaCorrienteApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  private base(idCliente: number): string {
    return `${this.baseUrl}/clientes/${idCliente}/cuenta-corriente`;
  }

  getByCliente(idCliente: number): Observable<CuentaCorriente> {
    return this.http.get<CuentaCorriente>(this.base(idCliente));
  }

  create(idCliente: number, dto: CuentaCorrienteDto): Observable<CuentaCorriente> {
    return this.http.post<CuentaCorriente>(this.base(idCliente), dto);
  }

  update(idCliente: number, dto: CuentaCorrienteDto): Observable<CuentaCorriente> {
    return this.http.patch<CuentaCorriente>(this.base(idCliente), dto);
  }
}
