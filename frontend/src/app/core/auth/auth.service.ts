import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, finalize, map, of, shareReplay, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CurrentUser } from '../models/current-user.model';

interface AuthResponse {
  user: CurrentUser;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  readonly currentUser = signal<CurrentUser | null>(null);
  readonly isAuthenticated = computed(() => this.currentUser() !== null);

  private refreshInFlight$: Observable<CurrentUser> | null = null;

  login(nombreUsuario: string, password: string): Observable<CurrentUser> {
    return this.http
      .post<AuthResponse>(
        `${this.baseUrl}/auth/login`,
        { nombre_usuario: nombreUsuario, password },
        { withCredentials: true },
      )
      .pipe(
        map((res) => res.user),
        tap((user) => this.currentUser.set(user)),
      );
  }

  /** Hidrata la sesión al arrancar la app (el JWT vive en una cookie httpOnly, invisible para JS). */
  fetchMe(): Observable<CurrentUser | null> {
    return this.http.get<AuthResponse>(`${this.baseUrl}/auth/me`, { withCredentials: true }).pipe(
      map((res) => res.user),
      tap((user) => this.currentUser.set(user)),
      catchError(() => {
        this.currentUser.set(null);
        return of(null);
      }),
    );
  }

  /**
   * El refresh token rota en cada uso (single-use). Si dos requests en paralelo
   * reciben 401 al mismo tiempo, comparten esta misma llamada en vez de disparar
   * dos refresh que se pisarían entre sí.
   */
  refresh(): Observable<CurrentUser> {
    if (this.refreshInFlight$) {
      return this.refreshInFlight$;
    }

    const request$ = this.http
      .post<AuthResponse>(`${this.baseUrl}/auth/refresh`, {}, { withCredentials: true })
      .pipe(
        map((res) => res.user),
        tap((user) => this.currentUser.set(user)),
        finalize(() => (this.refreshInFlight$ = null)),
        shareReplay({ bufferSize: 1, refCount: false }),
      );

    this.refreshInFlight$ = request$;
    return request$;
  }

  logout(): Observable<void> {
    return this.http
      .post<void>(`${this.baseUrl}/auth/logout`, {}, { withCredentials: true })
      .pipe(tap(() => this.currentUser.set(null)));
  }

  clearSession(): void {
    this.currentUser.set(null);
  }
}
