import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ServiceAutoelevador } from '../models/service-autoelevador.model';

export interface ServiceAutoelevadorDto {
  horas: number;
  detalle?: string;
}

@Injectable({ providedIn: 'root' })
export class ServiceAutoelevadorApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  private base(idAutoelevador: number): string {
    return `${this.baseUrl}/autoelevadores/${idAutoelevador}/servicios`;
  }

  list(idAutoelevador: number): Observable<ServiceAutoelevador[]> {
    return this.http.get<ServiceAutoelevador[]>(this.base(idAutoelevador));
  }

  create(idAutoelevador: number, dto: ServiceAutoelevadorDto): Observable<ServiceAutoelevador> {
    return this.http.post<ServiceAutoelevador>(this.base(idAutoelevador), dto);
  }

  update(
    idAutoelevador: number,
    idServicio: number,
    dto: Partial<ServiceAutoelevadorDto>,
  ): Observable<ServiceAutoelevador> {
    return this.http.patch<ServiceAutoelevador>(`${this.base(idAutoelevador)}/${idServicio}`, dto);
  }

  remove(idAutoelevador: number, idServicio: number): Observable<void> {
    return this.http.delete<void>(`${this.base(idAutoelevador)}/${idServicio}`);
  }
}
