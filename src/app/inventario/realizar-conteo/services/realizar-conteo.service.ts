import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  RegistrarValorRequest,
  RegistrarValorResponse,
  PrecargaResponse,
} from '../models';

@Injectable({ providedIn: 'root' })
export class RealizarConteoService {
  private http = inject(HttpClient);
  private apiUrl = '/api/v1/inventarios';

  getPrecargaItems(inventarioID: string): Observable<PrecargaResponse> {
    return this.http.get<PrecargaResponse>(
      `${this.apiUrl}/${inventarioID}/detalles?estado=en_progreso`
    );
  }

  registrarValor(
    inventarioID: string,
    itemID: string,
    request: RegistrarValorRequest
  ): Observable<RegistrarValorResponse> {
    return this.http.post<RegistrarValorResponse>(
      `${this.apiUrl}/${inventarioID}/items/${itemID}/valor`,
      request
    );
  }
}
