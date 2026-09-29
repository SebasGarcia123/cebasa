import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SemanaPlanProduccion } from '../models/semana-plan-produccion.model';

@Injectable({ providedIn: 'root' })
export class PlanProduccionApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/planes-produccion`;

  // fecha: cualquier día de la semana que se quiere ver (no hace falta
  // que sea lunes, el backend lo resuelve).
  semana(fecha: string): Observable<SemanaPlanProduccion> {
    const params = new HttpParams().set('fecha', fecha);
    return this.http.get<SemanaPlanProduccion>(`${this.baseUrl}/semana`, { params });
  }
}
