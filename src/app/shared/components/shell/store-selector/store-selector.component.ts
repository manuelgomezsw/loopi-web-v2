import { Component, inject, signal, OnInit } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

import { StoreContextService } from '../../../services/store-context.service';
import { TiendaOpcion } from '../../../models/nav.types';

interface ListaTiendasResponse {
  datos: TiendaOpcion[];
  total: number;
}

@Component({
  selector: 'app-store-selector',
  standalone: true,
  templateUrl: './store-selector.component.html',
})
export class StoreSelectorComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly storeCtx = inject(StoreContextService);

  readonly tiendas = signal<TiendaOpcion[]>([]);
  readonly cargando = signal(false);
  readonly error = signal(false);

  readonly contexto = this.storeCtx.context;

  ngOnInit(): void {
    this.cargarTiendas();
  }

  cargarTiendas(): void {
    this.cargando.set(true);
    this.error.set(false);

    const params = new HttpParams()
      .set('estado', 'activo')
      .set('pagina', '1')
      .set('limite', '100');

    this.http
      .get<ListaTiendasResponse>('/api/v1/tiendas', {
        params,
        withCredentials: true,
      })
      .subscribe({
        next: (res) => {
          this.tiendas.set(res.datos);
          this.cargando.set(false);
        },
        error: () => {
          this.error.set(true);
          this.cargando.set(false);
        },
      });
  }

  seleccionar(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    if (value === '') {
      this.storeCtx.setTienda(null);
    } else {
      const tienda = this.tiendas().find((t) => t.id === Number(value));
      if (tienda) this.storeCtx.setTienda(tienda);
    }
  }

  get valorActual(): string {
    return this.contexto().tienda_id !== null
      ? String(this.contexto().tienda_id)
      : '';
  }
}
