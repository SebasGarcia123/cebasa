import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MovimientoCuentaCorriente } from '../models/movimiento-cuenta-corriente.model';

export interface MovimientoCtaCteDto {
  fecha: string;
  monto: number;
  id_tipo_documento: number;
  saldo_resultante: number;
}

@Injectable({ providedIn: 'root' })
export class MovimientosCtaCteApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  private base(idCliente: number): string {
    return `${this.baseUrl}/clientes/${idCliente}/cuenta-corriente/movimientos`;
  }

  list(idCliente: number): Observable<MovimientoCuentaCorriente[]> {
    return this.http.get<MovimientoCuentaCorriente[]>(this.base(idCliente));
  }

  create(idCliente: number, dto: MovimientoCtaCteDto): Observable<MovimientoCuentaCorriente> {
    return this.http.post<MovimientoCuentaCorriente>(this.base(idCliente), dto);
  }

  remove(idCliente: number, idMovimiento: number): Observable<void> {
    return this.http.delete<void>(`${this.base(idCliente)}/${idMovimiento}`);
  }
}
