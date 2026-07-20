import { Routes } from '@angular/router';
import { InventarioConteoComponent } from './inventario-conteo.component';
import { InventarioHistorialComponent } from './inventario-historial.component';
import { InventarioDetalleComponent } from './inventario-detalle.component';
import { RealizarConteoComponent } from './realizar-conteo/realizar-conteo.component';

export const InventarioRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'iniciar',
        component: InventarioConteoComponent,
        data: { title: 'Iniciar Conteo de Inventario' }
      },
      {
        path: 'historial',
        component: InventarioHistorialComponent,
        data: { title: 'Historial de Conteos' }
      },
      {
        path: 'detalle/:id',
        component: InventarioDetalleComponent,
        data: { title: 'Detalle de Conteo' }
      },
      {
        path: ':id/realizar',
        component: RealizarConteoComponent,
        data: { title: 'Registrar Valores - Conteo' }
      },
      {
        path: '',
        redirectTo: 'iniciar',
        pathMatch: 'full'
      }
    ]
  }
];
