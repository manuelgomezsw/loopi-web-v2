import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import {
  TiendasService,
  TiendaRequest,
  TiendaUpdateRequest,
  TiendaResponse,
  ListaTiendasResponse,
} from './tiendas.service';

const tiendaEjemplo: TiendaResponse = {
  id: 1,
  codigo: 'TDA-001',
  nombre: 'Tienda Norte',
  direccion: 'Calle 100',
  ciudad: 'Bogotá',
  telefono: '300',
  activo: true,
  creado_por: 42,
  creado_en: '2026-05-23T10:00:00',
  actualizado_por: 42,
  actualizado_en: '2026-05-23T10:00:00',
};

const listaEjemplo: ListaTiendasResponse = {
  datos: [tiendaEjemplo],
  total: 1,
  pagina: 1,
  limite: 50,
};

describe('TiendasService', () => {
  let service: TiendasService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TiendasService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TiendasService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  // --- listar ---

  it('listar() debe llamar GET /api/v1/tiendas con los query params correctos', () => {
    service.listar('activas', 1, 50).subscribe((resp) => {
      expect(resp.total).toBe(1);
    });

    const req = httpMock.expectOne(
      (r) =>
        r.url === '/api/v1/tiendas' &&
        r.params.get('estado') === 'activas' &&
        r.params.get('pagina') === '1' &&
        r.params.get('limite') === '50',
    );
    expect(req.request.method).toBe('GET');
    req.flush(listaEjemplo);
  });

  it('listar() con estado "inactivas" envía el param correcto', () => {
    service.listar('inactivas', 2, 10).subscribe();

    const req = httpMock.expectOne(
      (r) =>
        r.url === '/api/v1/tiendas' && r.params.get('estado') === 'inactivas',
    );
    expect(req.request.params.get('pagina')).toBe('2');
    expect(req.request.params.get('limite')).toBe('10');
    req.flush({ ...listaEjemplo, datos: [] });
  });

  // --- obtener ---

  it('obtener() debe llamar GET /api/v1/tiendas/:id', () => {
    service.obtener(1).subscribe((resp) => {
      expect(resp.codigo).toBe('TDA-001');
    });

    const req = httpMock.expectOne('/api/v1/tiendas/1');
    expect(req.request.method).toBe('GET');
    req.flush(tiendaEjemplo);
  });

  // --- crear ---

  it('crear() debe llamar POST /api/v1/tiendas con el body correcto', () => {
    const payload: TiendaRequest = {
      codigo: 'TDA-001',
      nombre: 'Tienda Norte',
      direccion: 'Calle 100',
      ciudad: 'Bogotá',
      telefono: '300',
    };

    service.crear(payload).subscribe((resp) => {
      expect(resp.id).toBe(1);
    });

    const req = httpMock.expectOne('/api/v1/tiendas');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(tiendaEjemplo);
  });

  // --- actualizar ---

  it('actualizar() debe llamar PUT /api/v1/tiendas/:id sin campo codigo', () => {
    const payload: TiendaUpdateRequest = {
      nombre: 'Nuevo nombre',
      direccion: 'Otra calle',
      ciudad: 'Medellín',
      telefono: '301',
    };

    service.actualizar(1, payload).subscribe((resp) => {
      expect(resp.codigo).toBe('TDA-001');
    });

    const req = httpMock.expectOne('/api/v1/tiendas/1');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(payload);
    expect(req.request.body.codigo).toBeUndefined();
    req.flush({ ...tiendaEjemplo, nombre: 'Nuevo nombre' });
  });

  // --- inactivar ---

  it('inactivar() debe llamar POST /api/v1/tiendas/:id/inactivar', () => {
    service.inactivar(1).subscribe((resp) => {
      expect(resp.activo).toBeFalse();
    });

    const req = httpMock.expectOne('/api/v1/tiendas/1/inactivar');
    expect(req.request.method).toBe('POST');
    req.flush({ ...tiendaEjemplo, activo: false });
  });

  // --- reactivar ---

  it('reactivar() debe llamar POST /api/v1/tiendas/:id/reactivar', () => {
    service.reactivar(1).subscribe((resp) => {
      expect(resp.activo).toBeTrue();
    });

    const req = httpMock.expectOne('/api/v1/tiendas/1/reactivar');
    expect(req.request.method).toBe('POST');
    req.flush({ ...tiendaEjemplo, activo: true });
  });

  it('todos los métodos usan withCredentials: true (cookies JWT)', () => {
    service.listar('todas', 1, 50).subscribe();
    const req = httpMock.expectOne((r) => r.url === '/api/v1/tiendas');
    expect(req.request.withCredentials).toBeTrue();
  });
});
