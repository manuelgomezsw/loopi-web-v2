import { Routes } from '@angular/router';

export const UNIDADES_MEDIDA_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/lista-unidades/lista-unidades.component').then(
        (m) => m.ListaUnidadesComponent,
      ),
  },
  {
    path: 'nueva',
    loadComponent: () =>
      import('./pages/formulario-unidad/formulario-unidad.component').then(
        (m) => m.FormularioUnidadComponent,
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/detalle-unidad/detalle-unidad.component').then(
        (m) => m.DetalleUnidadComponent,
      ),
  },
  {
    path: ':id/editar',
    loadComponent: () =>
      import('./pages/formulario-unidad/formulario-unidad.component').then(
        (m) => m.FormularioUnidadComponent,
      ),
  },
];
