import { Routes } from '@angular/router';

import { authGuard } from './auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'tiendas',
        pathMatch: 'full',
      },
      {
        path: 'tiendas',
        loadComponent: () =>
          import('./tiendas/tiendas-lista/tiendas-lista.component').then(
            (m) => m.TiendasListaComponent,
          ),
      },
      {
        path: 'tiendas/nueva',
        loadComponent: () =>
          import('./tiendas/tienda-form/tienda-form.component').then(
            (m) => m.TiendaFormComponent,
          ),
      },
      {
        path: 'tiendas/:id/editar',
        loadComponent: () =>
          import('./tiendas/tienda-form/tienda-form.component').then(
            (m) => m.TiendaFormComponent,
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
