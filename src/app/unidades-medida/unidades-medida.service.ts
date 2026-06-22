import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export type TipoMedida = 'peso' | 'volumen' | 'unidad';

export interface UnidadMedida {
  id: number;
  codigo: string;
  nombre: string;
  tipo_medida: TipoMedida;
  factor_conversion: number;
  unidad_base: boolean;
  activo: boolean;
  creado_en: string;
  actualizado_en: string;
}

export interface UnidadMedidaDetalle extends UnidadMedida {
  items_con_unidad_canonica: number;
}

export interface ListarUnidadesMedidaResponse {
  unidades_medida: UnidadMedida[];
  total: number;
  page: number;
  limit: number;
}

export interface CrearUnidadMedidaRequest {
  codigo: string;
  nombre: string;
  tipo_medida: TipoMedida;
  factor_conversion: number;
}

export interface EditarUnidadMedidaRequest {
  nombre?: string;
  factor_conversion?: number;
}

export interface ImpactoInactivacionResponse {
  unidad_id: number;
  items_con_unidad_canonica: number;
  advertencia: string | null;
}

export interface InactivarUnidadResponse {
  id: number;
  activo: boolean;
  mensaje: string;
}

export interface ListarUMParams {
  tipo?: string;
  estado?: string;
  page?: number;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class UnidadesMedidaService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/v1/unidades_medida';

  listar(params: ListarUMParams = {}): Observable<ListarUnidadesMedidaResponse> {
    let p = new HttpParams();
    if (params.tipo) p = p.set('tipo', params.tipo);
    if (params.estado) p = p.set('estado', params.estado);
    if (params.page) p = p.set('page', params.page);
    if (params.limit) p = p.set('limit', params.limit);
    return this.http.get<ListarUnidadesMedidaResponse>(this.base, { params: p, withCredentials: true });
  }

  obtener(id: number): Observable<UnidadMedidaDetalle> {
    return this.http.get<UnidadMedidaDetalle>(`${this.base}/${id}`, { withCredentials: true });
  }

  crear(data: CrearUnidadMedidaRequest): Observable<UnidadMedida> {
    return this.http.post<UnidadMedida>(this.base, data, { withCredentials: true });
  }

  editar(id: number, data: EditarUnidadMedidaRequest): Observable<UnidadMedida> {
    return this.http.put<UnidadMedida>(`${this.base}/${id}`, data, { withCredentials: true });
  }

  getImpacto(id: number): Observable<ImpactoInactivacionResponse> {
    return this.http.get<ImpactoInactivacionResponse>(`${this.base}/${id}/impacto`, { withCredentials: true });
  }

  inactivar(id: number): Observable<InactivarUnidadResponse> {
    return this.http.patch<InactivarUnidadResponse>(`${this.base}/${id}/inactivar`, {}, { withCredentials: true });
  }
}
