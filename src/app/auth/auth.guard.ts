import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';

import { AuthService } from './auth.service';

/**
 * Guard funcional de autenticación (Angular standalone — no NgModule).
 *
 * Flujo (HU4):
 * 1. Si hay sesión en memoria → permitir navegación.
 * 2. Si no → llamar a GET /api/v1/auth/me con la cookie activa.
 *    - Éxito (200): almacena sesión en memoria y permite navegación.
 *    - Error (401): redirige al /login.
 */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Sesión ya presente en memoria → acceso inmediato.
  if (auth.estaAutenticado()) {
    return true;
  }

  // Intentar restaurar sesión desde la cookie activa.
  return auth.getMe().pipe(
    map(() => true),
    catchError(() => of(router.createUrlTree(['/login']))),
  );
};
