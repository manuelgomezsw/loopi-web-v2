import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Empleado {
  id: number;
  nombre: string;
  apellido: string;
  usuario: string;
  rol: 'admin' | 'lider_tienda' | 'barista';
  tienda_id: number | null;
  tipo_documento?: string;
  numero_documento?: string;
  telefono?: string;
  email?: string;
  fecha_nacimiento?: string;
  activo: boolean;
  requiere_cambio_contrasena: boolean;
  creado_en?: string;
  actualizado_en?: string;
}

export interface ListaEmpleadosResponse {
  empleados: Empleado[];
  total: number;
  page: number;
  limit: number;
}

export interface CrearEmpleadoResponse extends Empleado {
  contrasena_temporal: string;
}

export interface ResetContrasenaResponse {
  contrasena_temporal: string;
}

export interface CrearEmpleadoRequest {
  nombre: string;
  apellido: string;
  usuario: string;
  rol: string;
  tienda_id?: number;
  tipo_documento?: string;
  numero_documento?: string;
  telefono?: string;
  email?: string;
  fecha_nacimiento?: string;
}

export interface EditarEmpleadoRequest {
  nombre?: string;
  apellido?: string;
  rol?: string;
  tienda_id?: number;
  tipo_documento?: string;
  numero_documento?: string;
  telefono?: string;
  email?: string;
  fecha_nacimiento?: string;
}

export interface ListarEmpleadosParams {
  q?: string;
  tienda_id?: number;
  estado?: string;
  page?: number;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class EmpleadosService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/v1/empleados';

  listar(params: ListarEmpleadosParams): Observable<ListaEmpleadosResponse> {
    let p = new HttpParams();
    if (params.q) p = p.set('q', params.q);
    if (params.tienda_id != null) p = p.set('tienda_id', params.tienda_id);
    if (params.estado) p = p.set('estado', params.estado);
    if (params.page) p = p.set('page', params.page);
    if (params.limit) p = p.set('limit', params.limit);
    return this.http.get<ListaEmpleadosResponse>(this.base, { params: p, withCredentials: true });
  }

  obtener(id: number): Observable<Empleado> {
    return this.http.get<Empleado>(`${this.base}/${id}`, { withCredentials: true });
  }

  crear(data: CrearEmpleadoRequest): Observable<CrearEmpleadoResponse> {
    return this.http.post<CrearEmpleadoResponse>(this.base, data, { withCredentials: true });
  }

  editar(id: number, data: EditarEmpleadoRequest): Observable<Empleado> {
    return this.http.put<Empleado>(`${this.base}/${id}`, data, { withCredentials: true });
  }

  cambiarEstado(id: number, activo: boolean): Observable<{ id: number; activo: boolean }> {
    return this.http.patch<{ id: number; activo: boolean }>(
      `${this.base}/${id}/estado`,
      { activo },
      { withCredentials: true },
    );
  }

  resetearContrasena(id: number): Observable<ResetContrasenaResponse> {
    return this.http.post<ResetContrasenaResponse>(
      `${this.base}/${id}/contrasena`,
      {},
      { withCredentials: true },
    );
  }

  cambiarContrasena(id: number, nuevaContrasena: string): Observable<{ mensaje: string }> {
    return this.http.post<{ mensaje: string }>(
      `${this.base}/${id}/contrasena/cambiar`,
      { nueva_contrasena: nuevaContrasena },
      { withCredentials: true },
    );
  }
}
