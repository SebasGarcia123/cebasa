import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Permiso } from '../models/permiso.model';

export interface RolPermiso {
  id_rol: number;
  id_permiso: number;
  permisos: Permiso;
}

@Injectable({ providedIn: 'root' })
export class RolPermisosApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  list(idRol: number): Observable<RolPermiso[]> {
    return this.http.get<RolPermiso[]>(`${this.baseUrl}/roles/${idRol}/permisos`);
  }

  assign(idRol: number, idPermiso: number): Observable<RolPermiso> {
    return this.http.post<RolPermiso>(`${this.baseUrl}/roles/${idRol}/permisos/${idPermiso}`, {});
  }

  remove(idRol: number, idPermiso: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/roles/${idRol}/permisos/${idPermiso}`);
  }
}
