import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface TiendaResponse {
  id: number;
  codigo: string;
  nombre: string;
  direccion: string;
  ciudad: string;
  telefono: string;
  activo: boolean;
  creado_por: number;
  creado_en: string;
  actualizado_por: number;
  actualizado_en: string;
}

export interface ListaTiendasResponse {
  datos: TiendaResponse[];
  total: number;
  pagina: number;
  limite: number;
}

export interface TiendaRequest {
  codigo: string;
  nombre: string;
  direccion: string;
  ciudad: string;
  telefono: string;
}

export interface TiendaUpdateRequest {
  nombre: string;
  direccion: string;
  ciudad: string;
  telefono: string;
}

@Injectable({ providedIn: 'root' })
export class TiendasService {
  private readonly http = inject(HttpClient);

  listar(
    estado: string,
    pagina: number,
    limite: number,
  ): Observable<ListaTiendasResponse> {
    const params = new HttpParams()
      .set('estado', estado)
      .set('pagina', pagina)
      .set('limite', limite);
    return this.http.get<ListaTiendasResponse>('/api/v1/tiendas', {
      params,
      withCredentials: true,
    });
  }

  obtener(id: number): Observable<TiendaResponse> {
    return this.http.get<TiendaResponse>(`/api/v1/tiendas/${id}`, {
      withCredentials: true,
    });
  }

  crear(req: TiendaRequest): Observable<TiendaResponse> {
    return this.http.post<TiendaResponse>('/api/v1/tiendas', req, {
      withCredentials: true,
    });
  }

  actualizar(id: number, req: TiendaUpdateRequest): Observable<TiendaResponse> {
    return this.http.put<TiendaResponse>(`/api/v1/tiendas/${id}`, req, {
      withCredentials: true,
    });
  }

  inactivar(id: number): Observable<TiendaResponse> {
    return this.http.post<TiendaResponse>(
      `/api/v1/tiendas/${id}/inactivar`,
      {},
      { withCredentials: true },
    );
  }

  reactivar(id: number): Observable<TiendaResponse> {
    return this.http.post<TiendaResponse>(
      `/api/v1/tiendas/${id}/reactivar`,
      {},
      { withCredentials: true },
    );
  }
}
