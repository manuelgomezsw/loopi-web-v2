import { Routes } from '@angular/router';

import { authGuard } from './auth/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./shared/components/shell/shell.component').then(
        (m) => m.ShellComponent,
      ),
    children: [
      {
        path: '',
        redirectTo: 'tiendas',
        pathMatch: 'full',
      },
      {
        path: 'tiendas',
        canActivate: [roleGuard(['admin'])],
        loadComponent: () =>
          import('./tiendas/tiendas-lista/tiendas-lista.component').then(
            (m) => m.TiendasListaComponent,
          ),
      },
      {
        path: 'tiendas/nueva',
        canActivate: [roleGuard(['admin'])],
        loadComponent: () =>
          import('./tiendas/tienda-form/tienda-form.component').then(
            (m) => m.TiendaFormComponent,
          ),
      },
      {
        path: 'tiendas/:id/editar',
        canActivate: [roleGuard(['admin'])],
        loadComponent: () =>
          import('./tiendas/tienda-form/tienda-form.component').then(
            (m) => m.TiendaFormComponent,
          ),
      },
      {
        path: 'empleados',
        canActivate: [roleGuard(['admin'])],
        loadComponent: () =>
          import('./empleados/empleados-lista/empleados-lista.component').then(
            (m) => m.EmpleadosListaComponent,
          ),
      },
      {
        path: 'empleados/nuevo',
        canActivate: [roleGuard(['admin'])],
        loadComponent: () =>
          import('./empleados/empleado-form/empleado-form.component').then(
            (m) => m.EmpleadoFormComponent,
          ),
      },
      {
        path: 'empleados/:id/editar',
        canActivate: [roleGuard(['admin'])],
        loadComponent: () =>
          import('./empleados/empleado-form/empleado-form.component').then(
            (m) => m.EmpleadoFormComponent,
          ),
      },
      {
        path: 'unidades-medida',
        canActivate: [roleGuard(['admin'])],
        loadComponent: () =>
          import('./unidades-medida/unidades-medida-lista/unidades-medida-lista.component').then(
            (m) => m.UnidadesMedidaListaComponent,
          ),
      },
      {
        path: 'unidades-medida/nueva',
        canActivate: [roleGuard(['admin'])],
        loadComponent: () =>
          import('./unidades-medida/unidad-medida-form/unidad-medida-form.component').then(
            (m) => m.UnidadMedidaFormComponent,
          ),
      },
      {
        path: 'unidades-medida/:id/editar',
        canActivate: [roleGuard(['admin'])],
        loadComponent: () =>
          import('./unidades-medida/unidad-medida-form/unidad-medida-form.component').then(
            (m) => m.UnidadMedidaFormComponent,
          ),
      },
      {
        path: 'sin-permiso',
        loadComponent: () =>
          import('./shared/components/forbidden/forbidden.component').then(
            (m) => m.ForbiddenComponent,
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
