import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export type TipoItem = 'insumo' | 'material_consumo' | 'activo';
export type FrecuenciaInventario = 'diario' | 'semanal' | 'mensual';

export interface Item {
  id: number;
  codigo: string;
  nombre: string;
  tipo: TipoItem;
  subcategoria_id: number;
  subcategoria_nombre: string;
  proveedor_id: number | null;
  proveedor_nombre: string | null;
  unidad_medida_id: number;
  unidad_medida_simbolo: string;
  costo_unitario: number | null;
  frecuencia_inventario: FrecuenciaInventario;
  stock_seguridad: string;
  tiempo_entrega_dias: number | null;
  activo: boolean;
  creado_por: number;
  creado_en: string;
  actualizado_por: number;
  actualizado_en: string;
}

export interface ItemDetalle extends Item {
  esta_en_uso: boolean;
}

export interface ListarItemsResponse {
  items: Item[];
  total: number;
  pagina: number;
  total_paginas: number;
}

export interface ListarItemsParams {
  tipo?: string;
  frecuencia?: string;
  activo?: boolean;
  pagina?: number;
  por_pagina?: number;
}

export interface CrearItemRequest {
  codigo: string;
  nombre: string;
  tipo: TipoItem;
  subcategoria_id: number;
  proveedor_id?: number;
  unidad_medida_id: number;
  costo_unitario?: number;
  frecuencia_inventario: FrecuenciaInventario;
  stock_seguridad: string;
  tiempo_entrega_dias?: number;
}

export interface EditarItemRequest {
  codigo?: string;
  nombre: string;
  subcategoria_id: number;
  proveedor_id?: number;
  unidad_medida_id: number;
  costo_unitario?: number;
  frecuencia_inventario: FrecuenciaInventario;
  stock_seguridad: string;
  tiempo_entrega_dias?: number;
  confirmar_cambio_unidad?: boolean;
}

export interface CambiarEstadoResponse {
  id: number;
  codigo: string;
  nombre: string;
  activo: boolean;
  actualizado_por: number;
  actualizado_en: string;
}

export interface CostoTiendaHistorialEntry {
  id: number;
  costo_unitario: number;
  vigente_desde: string;
  creado_por: number;
  creado_en: string;
}

export interface CostoPorTienda {
  tienda_id: number;
  tienda_nombre: string;
  costo_vigente: number;
  historial: CostoTiendaHistorialEntry[];
}

export interface HistorialCostosResponse {
  item_id: number;
  costo_global: number | null;
  costos_por_tienda: CostoPorTienda[];
}

export interface RegistrarCostoTiendaRequest {
  tienda_id: number;
  costo_unitario: number;
}

export interface CostoTiendaResponse {
  id: number;
  item_id: number;
  tienda_id: number;
  costo_unitario: number;
  vigente_desde: string;
  creado_por: number;
  creado_en: string;
}

@Injectable({ providedIn: 'root' })
export class ItemsService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/v1/items';

  listarItems(params: ListarItemsParams = {}): Observable<ListarItemsResponse> {
    let p = new HttpParams();
    if (params.tipo) p = p.set('tipo', params.tipo);
    if (params.frecuencia) p = p.set('frecuencia', params.frecuencia);
    if (params.activo !== undefined) p = p.set('activo', String(params.activo));
    if (params.pagina) p = p.set('pagina', params.pagina);
    if (params.por_pagina) p = p.set('por_pagina', params.por_pagina);
    return this.http.get<ListarItemsResponse>(this.base, { params: p, withCredentials: true });
  }

  obtenerItem(id: number): Observable<ItemDetalle> {
    return this.http.get<ItemDetalle>(`${this.base}/${id}`, { withCredentials: true });
  }

  crearItem(req: CrearItemRequest): Observable<ItemDetalle> {
    return this.http.post<ItemDetalle>(this.base, req, { withCredentials: true });
  }

  editarItem(id: number, req: EditarItemRequest): Observable<ItemDetalle> {
    return this.http.put<ItemDetalle>(`${this.base}/${id}`, req, { withCredentials: true });
  }

  inactivarItem(id: number): Observable<CambiarEstadoResponse> {
    return this.http.patch<CambiarEstadoResponse>(`${this.base}/${id}/inactivar`, {}, { withCredentials: true });
  }

  reactivarItem(id: number): Observable<CambiarEstadoResponse> {
    return this.http.patch<CambiarEstadoResponse>(`${this.base}/${id}/reactivar`, {}, { withCredentials: true });
  }

  obtenerCostosTienda(itemId: number): Observable<HistorialCostosResponse> {
    return this.http.get<HistorialCostosResponse>(`${this.base}/${itemId}/costos_tienda`, { withCredentials: true });
  }

  registrarCostoTienda(itemId: number, req: RegistrarCostoTiendaRequest): Observable<CostoTiendaResponse> {
    return this.http.post<CostoTiendaResponse>(`${this.base}/${itemId}/costos_tienda`, req, { withCredentials: true });
  }
}
