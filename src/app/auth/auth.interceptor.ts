import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AuthService } from './auth.service';

/**
 * Interceptor funcional de autenticación (Angular standalone).
 *
 * Comportamiento ante un 401 en endpoint no-login (HU4 + HU5):
 * - Si había sesión en memoria → el token expiró durante operación activa.
 *   Limpia sesión y redirige al login con aviso de "Sesión expirada".
 * - Si no había sesión → el usuario intentó acceder sin autenticarse.
 *   Redirige al login sin mensaje adicional.
 *
 * El login en sí nunca pasa por este interceptor porque devuelve 401 como
 * parte de su flujo normal (credenciales inválidas).
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((err: unknown) => {
      if (
        err instanceof HttpErrorResponse &&
        err.status === 401 &&
        !req.url.includes('/auth/login')
      ) {
        const teniaSesion = auth.estaAutenticado();

        // Limpiar estado en memoria.
        auth.sesion.set(null);

        if (teniaSesion) {
          // HU5: sesión expiró durante operación activa.
          router.navigate(['/login'], {
            queryParams: { motivo: 'sesion_expirada' },
          });
        } else {
          router.navigate(['/login']);
        }
      }

      return throwError(() => err);
    }),
  );
};
