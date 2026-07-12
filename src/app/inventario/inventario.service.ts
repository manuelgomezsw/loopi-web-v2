import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SugerenciaResp {
  tipo: string;
  horario: string;
}

export interface ItemDetailResp {
  id: number;
  item_id: number;
  valor_sugerido: number;
  valor_esperado: number;
  valor_real?: number;
  diferencia?: number;
}

export interface InventarioResp {
  id: number;
  tienda_id: number;
  fecha: string;
  tipo: string;
  horario?: string;
  estado: string;
  responsable_id: number;
  iniciado_en: string;
  completado_en?: string;
  items: ItemDetailResp[];
}

export interface HistorialResp {
  inventarios: InventarioResp[];
  total: number;
  pagina: number;
  total_paginas: number;
}

export interface ErrorResp {
  error: string;
  mensaje: string;
  campo?: string;
  detalles?: Record<string, unknown>;
}

@Injectable({
  providedIn: 'root'
})
export class InventarioService {
  private baseUrl = '/api/v1/inventarios';

  constructor(private http: HttpClient) { }

  // GET /inventarios/sugerencia
  getSugerencia(): Observable<SugerenciaResp> {
    return this.http.get<SugerenciaResp>(`${this.baseUrl}/sugerencia`);
  }

  // POST /inventarios
  iniciarConteo(req: { tienda_id: number; tipo: string; horario?: string }): Observable<InventarioResp> {
    return this.http.post<InventarioResp>(this.baseUrl, req);
  }

  // GET /inventarios/{id}
  getInventario(id: number): Observable<InventarioResp> {
    return this.http.get<InventarioResp>(`${this.baseUrl}/${id}`);
  }

  // PATCH /inventarios/{id}/items/{item_id}
  registrarValorReal(inventarioId: number, itemId: number, valorReal: number): Observable<ItemDetailResp> {
    return this.http.patch<ItemDetailResp>(
      `${this.baseUrl}/${inventarioId}/items/${itemId}`,
      { valor_real: valorReal }
    );
  }

  // POST /inventarios/{id}/confirmar
  confirmarConteo(id: number): Observable<InventarioResp> {
    return this.http.post<InventarioResp>(`${this.baseUrl}/${id}/confirmar`, {});
  }

  // DELETE /inventarios/{id}
  eliminarConteo(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  // GET /inventarios (historial con filtros)
  getHistorial(filtros?: {
    tienda_id?: number;
    tipo?: string;
    estado?: string;
    desde?: string;
    hasta?: string;
    pagina?: number;
    por_pagina?: number;
  }): Observable<HistorialResp> {
    let params = new HttpParams();

    if (filtros) {
      if (filtros.tienda_id) params = params.set('tienda_id', filtros.tienda_id.toString());
      if (filtros.tipo) params = params.set('tipo', filtros.tipo);
      if (filtros.estado) params = params.set('estado', filtros.estado);
      if (filtros.desde) params = params.set('desde', filtros.desde);
      if (filtros.hasta) params = params.set('hasta', filtros.hasta);
      if (filtros.pagina) params = params.set('pagina', filtros.pagina.toString());
      if (filtros.por_pagina) params = params.set('por_pagina', filtros.por_pagina.toString());
    }

    return this.http.get<HistorialResp>(this.baseUrl, { params });
  }
}
