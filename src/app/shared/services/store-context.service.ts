import { Injectable, signal, computed } from '@angular/core';

import { StoreContext, TiendaOpcion } from '../models/nav.types';
import { SesionState } from '../../auth/auth.service';

const CONSOLIDADO: StoreContext = { tienda_id: null, nombre: null };

@Injectable({ providedIn: 'root' })
export class StoreContextService {
  private readonly _context = signal<StoreContext>(CONSOLIDADO);
  private _esAdmin = false;

  /** Contexto de tienda activo (solo lectura para consumidores). */
  readonly context = computed(() => this._context());

  /**
   * Inicializa el contexto desde la sesión activa.
   * Admin → vista consolidada por defecto.
   * lider_tienda / barista → contexto fijo según tienda_id del JWT.
   */
  initFromSession(sesion: SesionState): void {
    this._esAdmin = sesion.rol === 'admin';

    if (sesion.rol === 'admin' || sesion.rol === 'lider_compras') {
      this._context.set(CONSOLIDADO);
    } else {
      this._context.set({
        tienda_id: sesion.tienda_id,
        nombre: null,
      });
    }
  }

  /**
   * Cambia el contexto de tienda activa.
   * Solo tiene efecto para el rol admin; para otros roles es no-op.
   */
  setTienda(tienda: TiendaOpcion | null): void {
    if (!this._esAdmin) return;

    if (tienda === null) {
      this._context.set(CONSOLIDADO);
    } else {
      this._context.set({ tienda_id: tienda.id, nombre: tienda.nombre });
    }
  }
}
