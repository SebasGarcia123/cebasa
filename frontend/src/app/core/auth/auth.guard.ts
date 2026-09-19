import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  // Recién arrancó la app: no sabemos si hay sesión hasta preguntarle al backend
  // (el JWT vive en una cookie httpOnly que JS no puede leer).
  return authService.fetchMe().pipe(map((user) => !!user || router.createUrlTree(['/login'])));
};
