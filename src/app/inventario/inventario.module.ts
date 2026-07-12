import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventarioConteoComponent } from './inventario-conteo.component';
import { InventarioHistorialComponent } from './inventario-historial.component';
import { InventarioDetalleComponent } from './inventario-detalle.component';

// Componentes transversales del catálogo
// TODO: Importar reales desde su ubicación correcta en el proyecto
// import { ListCardComponent } from '../_shared/components/list-card/list-card.component';
// import { FilterBarComponent } from '../_shared/components/filter-bar/filter-bar.component';
// import { PaginationComponent } from '../_shared/components/pagination/pagination.component';
// import { FormCardComponent } from '../_shared/components/form-card/form-card.component';
// import { StatusBadgeComponent } from '../_shared/components/status-badge/status-badge.component';

@NgModule({
  declarations: [
    InventarioConteoComponent,
    InventarioHistorialComponent,
    InventarioDetalleComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    // ListCardComponent,
    // FilterBarComponent,
    // PaginationComponent,
    // FormCardComponent,
    // StatusBadgeComponent
  ]
})
export class InventarioModule { }
