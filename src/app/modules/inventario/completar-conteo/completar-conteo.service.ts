import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfirmarResponse, ConfirmarRequest } from './completar-conteo.model';

@Injectable({
  providedIn: 'root',
})
export class CompletarConteoService {
  private apiUrl = '/api/v1/inventarios';

  constructor(private http: HttpClient) {}

  confirmarConteo(inventarioId: number, request: ConfirmarRequest): Observable<ConfirmarResponse> {
    return this.http.post<ConfirmarResponse>(
      `${this.apiUrl}/${inventarioId}/confirmar`,
      request
    );
  }

  getInventarioDetalle(inventarioId: number) {
    return this.http.get(`${this.apiUrl}/${inventarioId}/detalles`);
  }
}
