import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

/** Respuesta del endpoint POST /api/v1/auth/login. */
export interface LoginResponse {
  rol: string;
  tienda_id: number | null;
}

/** Respuesta del endpoint GET /api/v1/auth/me. */
export interface MeResponse {
  sub: string;
  rol: string;
  tienda_id: number | null;
}

/** Estado de sesión almacenado en memoria (nunca en localStorage). */
export interface SesionState {
  rol: string;
  tienda_id: number | null;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  /** Señal reactiva con el estado de sesión actual. null = no autenticado. */
  readonly sesion = signal<SesionState | null>(null);

  constructor(private readonly http: HttpClient) {}

  /**
   * Autentica al usuario contra POST /api/v1/auth/login.
   * En caso de éxito almacena rol y tienda_id en memoria (no localStorage).
   * Las cookies jwt y XSRF-TOKEN las gestiona el navegador automáticamente.
   */
  login(usuario: string, contrasena: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(
        '/api/v1/auth/login',
        { usuario, contrasena },
        { withCredentials: true },
      )
      .pipe(
        tap((res) => {
          this.sesion.set({ rol: res.rol, tienda_id: res.tienda_id });
        }),
      );
  }

  /**
   * Cierra la sesión en el servidor y limpia el estado local.
   * Angular incluye automáticamente X-XSRF-TOKEN gracias a withXsrfConfiguration.
   */
  logout(): Observable<void> {
    return this.http
      .post<void>('/api/v1/auth/logout', null, { withCredentials: true })
      .pipe(
        tap(() => {
          this.sesion.set(null);
        }),
      );
  }

  /**
   * Recupera el estado de sesión activo desde el servidor.
   * Útil para restaurar sesión al recargar la página (HU4).
   */
  getMe(): Observable<MeResponse> {
    return this.http
      .get<MeResponse>('/api/v1/auth/me', { withCredentials: true })
      .pipe(
        tap((res) => {
          this.sesion.set({ rol: res.rol, tienda_id: res.tienda_id });
        }),
      );
  }

  /** Devuelve true si hay una sesión activa en memoria. */
  estaAutenticado(): boolean {
    return this.sesion() !== null;
  }
}
