import { Injectable, inject, computed } from '@angular/core';

import { NavItem, Rol } from '../models/nav.types';
import { NAV_ITEMS } from '../../nav-config';
import { AuthService } from '../../auth/auth.service';

@Injectable({ providedIn: 'root' })
export class NavConfigService {
  private readonly auth = inject(AuthService);

  /** Ítems de menú filtrados por el rol del usuario activo, ordenados por `orden`. */
  readonly navItems = computed<NavItem[]>(() => {
    const sesion = this.auth.sesion();
    if (!sesion) return [];

    const rol = sesion.rol as Rol;
    return NAV_ITEMS.filter((item) => item.roles.includes(rol))
      .map((item) => ({
        ...item,
        children: item.children
          ?.filter((child) => child.roles.includes(rol))
          .sort((a, b) => a.orden - b.orden),
      }))
      .sort((a, b) => a.orden - b.orden);
  });
}
