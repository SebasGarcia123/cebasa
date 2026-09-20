import { HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { readCookie } from './cookie.util';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const CSRF_COOKIE = 'csrf_token';
const CSRF_HEADER = 'x-csrf-token';

/**
 * Clona el request agregando el header CSRF con el valor ACTUAL de la
 * cookie. Se exporta aparte (no solo como interceptor) porque el retry de
 * refreshInterceptor también la necesita: la cookie csrf_token rota en
 * cada refresh, así que un reintento no puede reusar el header ya armado
 * antes del refresh o el backend lo rechaza con 403.
 */
export function attachCsrfHeader(req: HttpRequest<unknown>): HttpRequest<unknown> {
  if (!MUTATING_METHODS.has(req.method)) {
    return req;
  }
  const csrfToken = readCookie(CSRF_COOKIE);
  return csrfToken ? req.clone({ setHeaders: { [CSRF_HEADER]: csrfToken } }) : req;
}

/**
 * Manda cookies en cada request (para que viajen las de auth httpOnly) y,
 * en requests que modifican datos, agrega el header CSRF leyendo la cookie
 * legible por JS que el backend setea junto con la sesión.
 */
export const csrfInterceptor: HttpInterceptorFn = (req, next) => {
  const withCredentials = req.clone({ withCredentials: true });
  return next(attachCsrfHeader(withCredentials));
};
