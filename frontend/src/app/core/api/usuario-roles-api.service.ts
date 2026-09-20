import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Rol } from '../models/rol.model';

export interface UsuarioRol {
  id_usuario: number;
  id_rol: number;
  roles: Rol;
}

@Injectable({ providedIn: 'root' })
export class UsuarioRolesApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  list(idUsuario: number): Observable<UsuarioRol[]> {
    return this.http.get<UsuarioRol[]>(`${this.baseUrl}/usuarios/${idUsuario}/roles`);
  }

  assign(idUsuario: number, idRol: number): Observable<UsuarioRol> {
    return this.http.post<UsuarioRol>(`${this.baseUrl}/usuarios/${idUsuario}/roles/${idRol}`, {});
  }

  remove(idUsuario: number, idRol: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/usuarios/${idUsuario}/roles/${idRol}`);
  }
}
