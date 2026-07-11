import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Proveedor {
  id: number;
  razon_social: string;
  nit: string;
  nombre_contacto: string | null;
  telefono_contacto: string | null;
  email_contacto: string | null;
  activo: boolean;
  creado_en: string;
  actualizado_en: string;
}

export interface ProveedorDetalle extends Proveedor {
  items_asignados: number;
}

export interface ListarProveedoresResponse {
  proveedores: Proveedor[];
  total: number;
  page: number;
  limit: number;
}

export interface CrearProveedorRequest {
  razon_social: string;
  nit: string;
  nombre_contacto?: string;
  telefono_contacto?: string;
  email_contacto?: string;
}

export interface EditarProveedorRequest {
  razon_social?: string;
  nit?: string;
  nombre_contacto?: string;
  telefono_contacto?: string;
  email_contacto?: string;
}

export interface CambiarEstadoResponse {
  id: number;
  activo: boolean;
  mensaje: string;
}

export interface ListarProveedoresParams {
  estado?: string;
  busqueda?: string;
  page?: number;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class ProveedoresService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/v1/proveedores';

  listar(params: ListarProveedoresParams = {}): Observable<ListarProveedoresResponse> {
    let p = new HttpParams();
    if (params.estado) p = p.set('estado', params.estado);
    if (params.busqueda) p = p.set('busqueda', params.busqueda);
    if (params.page) p = p.set('page', params.page);
    if (params.limit) p = p.set('limit', params.limit);
    return this.http.get<ListarProveedoresResponse>(this.base, { params: p, withCredentials: true });
  }

  obtener(id: number): Observable<ProveedorDetalle> {
    return this.http.get<ProveedorDetalle>(`${this.base}/${id}`, { withCredentials: true });
  }

  crear(data: CrearProveedorRequest): Observable<Proveedor> {
    return this.http.post<Proveedor>(this.base, data, { withCredentials: true });
  }

  editar(id: number, data: EditarProveedorRequest): Observable<Proveedor> {
    return this.http.put<Proveedor>(`${this.base}/${id}`, data, { withCredentials: true });
  }

  inactivar(id: number): Observable<CambiarEstadoResponse> {
    return this.http.patch<CambiarEstadoResponse>(`${this.base}/${id}/inactivar`, {}, { withCredentials: true });
  }

  activar(id: number): Observable<CambiarEstadoResponse> {
    return this.http.patch<CambiarEstadoResponse>(`${this.base}/${id}/activar`, {}, { withCredentials: true });
  }
}
