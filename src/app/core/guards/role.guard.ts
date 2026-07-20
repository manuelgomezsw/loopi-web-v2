import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../../auth/auth.service';
import { Rol } from '../../shared/models/nav.types';

/** Ruta principal por rol cuando se intenta acceder a una ruta no autorizada. */
function defaultRouteForRole(rol: Rol): string {
  switch (rol) {
    case 'admin':
      return '/tiendas';
    case 'lider_compras':
      return '/pedidos';
    case 'lider_tienda':
      return '/inventario';
    case 'barista':
      return '/inventario';
  }
}

/**
 * Guard funcional que verifica que el usuario activo tenga uno de los roles permitidos.
 *
 * Sin sesión → redirige a /login.
 * Rol no autorizado → redirige a la ruta principal del rol.
 * Rol autorizado → permite la navegación.
 *
 * Nota: El authGuard debe ejecutarse ANTES de este guard para restaurar la sesión
 * desde getMe() si es necesario.
 */
export function roleGuard(allowedRoles: Rol[]): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    const sesion = auth.sesion();

    if (!sesion) {
      return router.createUrlTree(['/login']);
    }

    const rol = sesion.rol as Rol;

    if (!allowedRoles.includes(rol)) {
      return router.createUrlTree([defaultRouteForRole(rol)]);
    }

    return true;
  };
}
