import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { attachCsrfHeader } from './csrf.interceptor';

const AUTH_ENDPOINTS = ['/auth/login', '/auth/refresh', '/auth/logout'];

/**
 * Ante un 401 en cualquier request que no sea del propio flujo de auth,
 * intenta refrescar la sesión una vez (silencioso, sin cortar lo que el
 * usuario esté haciendo) y reintenta el request original. Si el refresh
 * tambien falla, la sesión realmente se venció: se limpia y se manda a login.
 */
export const refreshInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isAuthEndpoint = AUTH_ENDPOINTS.some((endpoint) => req.url.includes(endpoint));

  return next(req).pipe(
    catchError((error: unknown) => {
      const isUnauthorized = error instanceof HttpErrorResponse && error.status === 401;

      if (!isUnauthorized || isAuthEndpoint) {
        return throwError(() => error);
      }

      return authService.refresh().pipe(
        // El refresh rota la cookie csrf_token en el servidor; el header
        // que `req` trae (armado antes de este 401) quedó viejo, así que
        // hay que releerla recién ahora o el reintento se cae con 403.
        switchMap(() => next(attachCsrfHeader(req))),
        catchError((refreshError) => {
          authService.clearSession();
          void router.navigate(['/login']);
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};
