import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  CrearUnidadMedidaRequest,
  EditarUnidadMedidaRequest,
  ImpactoInactivacionResponse,
  InactivarUnidadResponse,
  ListarUnidadesMedidaResponse,
  UnidadMedida,
  UnidadMedidaDetalle,
} from '../models/unidad-medida.model';

export interface ListarUMParams {
  tipo?: string;
  activo?: boolean;
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
    if (params.activo != null) p = p.set('activo', params.activo);
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
