import { Routes } from '@angular/router';
import { InventarioConteoComponent } from './inventario-conteo.component';
import { InventarioHistorialComponent } from './inventario-historial.component';
import { InventarioDetalleComponent } from './inventario-detalle.component';

export const InventarioRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'conteo',
        component: InventarioConteoComponent,
        data: { title: 'Conteo de Inventario' }
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
        path: '',
        redirectTo: 'conteo',
        pathMatch: 'full'
      }
    ]
  }
];
