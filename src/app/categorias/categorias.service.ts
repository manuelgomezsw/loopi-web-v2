import { inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Subcategoria {
  id: number;
  nombre: string;
  categoria_id: number;
  activo: boolean;
  creado_por: number;
  creado_en: string;
  actualizado_por: number;
  actualizado_en: string;
  total_items: number;
}

export interface Categoria {
  id: number;
  nombre: string;
  activo: boolean;
  creado_por: number;
  creado_en: string;
  actualizado_por: number;
  actualizado_en: string;
  subcategorias: Subcategoria[];
}

export interface CatalogoResponse {
  categorias: Categoria[];
  total: number;
}

export interface ImpactoResponse {
  subcategorias_activas: number;
}

export interface InactivarCategoriaResponse {
  id: number;
  nombre: string;
  activo: boolean;
  subcategorias_inactivadas: number;
  actualizado_por: number;
  actualizado_en: string;
}

@Injectable({ providedIn: 'root' })
export class CategoriasService {
  private readonly http = inject(HttpClient);
  private readonly baseC = '/api/v1/categorias';
  private readonly baseS = '/api/v1/subcategorias';

  readonly cargando = signal(false);
  readonly errorMsg = signal('');

  obtenerCatalogo(estado?: string): Observable<CatalogoResponse> {
    let params = new HttpParams();
    if (estado && estado !== 'todos') params = params.set('estado', estado);
    return this.http.get<CatalogoResponse>(this.baseC, { params, withCredentials: true });
  }

  obtenerCategoria(id: number): Observable<Categoria> {
    return this.http.get<Categoria>(`${this.baseC}/${id}`, { withCredentials: true });
  }

  crearCategoria(nombre: string): Observable<Categoria> {
    return this.http.post<Categoria>(this.baseC, { nombre }, { withCredentials: true });
  }

  editarCategoria(id: number, nombre: string): Observable<Categoria> {
    return this.http.put<Categoria>(`${this.baseC}/${id}`, { nombre }, { withCredentials: true });
  }

  impactoCategoria(id: number): Observable<ImpactoResponse> {
    return this.http.get<ImpactoResponse>(`${this.baseC}/${id}/impacto`, { withCredentials: true });
  }

  inactivarCategoria(id: number): Observable<InactivarCategoriaResponse> {
    return this.http.patch<InactivarCategoriaResponse>(`${this.baseC}/${id}/inactivar`, {}, { withCredentials: true });
  }

  reactivarCategoria(id: number): Observable<Categoria> {
    return this.http.patch<Categoria>(`${this.baseC}/${id}/reactivar`, {}, { withCredentials: true });
  }

  crearSubcategoria(nombre: string, categoriaId: number): Observable<Subcategoria> {
    return this.http.post<Subcategoria>(this.baseS, { nombre, categoria_id: categoriaId }, { withCredentials: true });
  }

  editarSubcategoria(id: number, nombre: string): Observable<Subcategoria> {
    return this.http.put<Subcategoria>(`${this.baseS}/${id}`, { nombre }, { withCredentials: true });
  }

  inactivarSubcategoria(id: number): Observable<Subcategoria> {
    return this.http.patch<Subcategoria>(`${this.baseS}/${id}/inactivar`, {}, { withCredentials: true });
  }

  reactivarSubcategoria(id: number): Observable<Subcategoria> {
    return this.http.patch<Subcategoria>(`${this.baseS}/${id}/reactivar`, {}, { withCredentials: true });
  }
}
