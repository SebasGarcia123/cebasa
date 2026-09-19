import { HttpInterceptorFn } from '@angular/common/http';
import { readCookie } from './cookie.util';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const CSRF_COOKIE = 'csrf_token';
const CSRF_HEADER = 'x-csrf-token';

/**
 * Manda cookies en cada request (para que viajen las de auth httpOnly) y,
 * en requests que modifican datos, agrega el header CSRF leyendo la cookie
 * legible por JS que el backend setea junto con la sesión.
 */
export const csrfInterceptor: HttpInterceptorFn = (req, next) => {
  let cloned = req.clone({ withCredentials: true });

  if (MUTATING_METHODS.has(req.method)) {
    const csrfToken = readCookie(CSRF_COOKIE);
    if (csrfToken) {
      cloned = cloned.clone({ setHeaders: { [CSRF_HEADER]: csrfToken } });
    }
  }

  return next(cloned);
};
