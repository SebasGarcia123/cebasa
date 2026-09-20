import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Reclamo } from '../models/reclamo.model';
import { components } from './schema';

type CreateReclamoDto = components['schemas']['CreateReclamoDto'];
type ResolverReclamoDto = components['schemas']['ResolverReclamoDto'];
type RechazarReclamoDto = components['schemas']['RechazarReclamoDto'];

// Un reclamo no se edita ni se elimina una vez creado: solo se resuelve o
// se rechaza. Por eso no extiende CrudApi (no hay update/remove genéricos).
@Injectable({ providedIn: 'root' })
export class ReclamosApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/reclamos`;

  // Cantidad de reclamos activos (pendientes de resolver o rechazar), para
  // el indicador del menú lateral. Es un singleton (providedIn: 'root'),
  // así que el Shell y la pantalla de Reclamos comparten el mismo signal.
  readonly pendientesCount = signal(0);

  list(): Observable<Reclamo[]> {
    return this.http.get<Reclamo[]>(this.baseUrl);
  }

  getOne(id: number): Observable<Reclamo> {
    return this.http.get<Reclamo>(`${this.baseUrl}/${id}`);
  }

  create(dto: CreateReclamoDto): Observable<Reclamo> {
    return this.http.post<Reclamo>(this.baseUrl, dto);
  }

  resolver(id: number, dto: ResolverReclamoDto): Observable<Reclamo> {
    return this.http.post<Reclamo>(`${this.baseUrl}/${id}/resolver`, dto);
  }

  rechazar(id: number, dto: RechazarReclamoDto): Observable<Reclamo> {
    return this.http.post<Reclamo>(`${this.baseUrl}/${id}/rechazar`, dto);
  }

  refreshPendientesCount(): void {
    this.http
      .get<{ count: number }>(`${this.baseUrl}/pendientes/count`)
      .pipe(tap((res) => this.pendientesCount.set(res.count)))
      .subscribe();
  }
}
