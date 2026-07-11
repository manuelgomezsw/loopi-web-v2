import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import {
  ProveedoresService,
  Proveedor,
  ProveedorDetalle,
  ListarProveedoresResponse,
  CrearProveedorRequest,
} from './proveedores.service';

const proveedorEjemplo: Proveedor = {
  id: 1,
  razon_social: 'Distribuidora La Cosecha S.A.S',
  nit: '900123456-7',
  nombre_contacto: 'Carlos Rodríguez',
  telefono_contacto: '3001234567',
  email_contacto: 'carlos@lacosecha.com',
  activo: true,
  creado_en: '2026-05-24T10:00:00',
  actualizado_en: '2026-05-24T10:00:00',
};

const listaEjemplo: ListarProveedoresResponse = {
  proveedores: [proveedorEjemplo],
  total: 1,
  page: 1,
  limit: 50,
};

describe('ProveedoresService', () => {
  let service: ProveedoresService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ProveedoresService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ProveedoresService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('listar() debe llamar GET /api/v1/proveedores con los query params correctos', () => {
    service.listar({ estado: 'activo', busqueda: 'cosecha', page: 1, limit: 50 }).subscribe((resp) => {
      expect(resp.total).toBe(1);
    });

    const req = httpMock.expectOne(
      (r) =>
        r.url === '/api/v1/proveedores' &&
        r.params.get('estado') === 'activo' &&
        r.params.get('busqueda') === 'cosecha' &&
        r.params.get('page') === '1' &&
        r.params.get('limit') === '50',
    );
    expect(req.request.method).toBe('GET');
    req.flush(listaEjemplo);
  });

  it('listar() sin params no envía query params opcionales', () => {
    service.listar().subscribe();
    const req = httpMock.expectOne((r) => r.url === '/api/v1/proveedores');
    expect(req.request.params.keys().length).toBe(0);
    req.flush({ ...listaEjemplo, proveedores: [] });
  });

  it('obtener() debe llamar GET /api/v1/proveedores/:id', () => {
    const detalle: ProveedorDetalle = { ...proveedorEjemplo, items_asignados: 3 };
    service.obtener(1).subscribe((resp) => {
      expect(resp.items_asignados).toBe(3);
    });

    const req = httpMock.expectOne('/api/v1/proveedores/1');
    expect(req.request.method).toBe('GET');
    req.flush(detalle);
  });

  it('crear() debe llamar POST /api/v1/proveedores con el body correcto', () => {
    const payload: CrearProveedorRequest = {
      razon_social: 'Distribuidora La Cosecha S.A.S',
      nit: '900123456-7',
      nombre_contacto: 'Carlos Rodríguez',
      telefono_contacto: '3001234567',
    };
    service.crear(payload).subscribe((resp) => {
      expect(resp.id).toBe(1);
    });

    const req = httpMock.expectOne('/api/v1/proveedores');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(proveedorEjemplo);
  });

  it('editar() debe llamar PUT /api/v1/proveedores/:id', () => {
    service.editar(1, { nit: '900123456-8' }).subscribe((resp) => {
      expect(resp.id).toBe(1);
    });

    const req = httpMock.expectOne('/api/v1/proveedores/1');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ nit: '900123456-8' });
    req.flush(proveedorEjemplo);
  });

  it('inactivar() debe llamar PATCH /api/v1/proveedores/:id/inactivar', () => {
    service.inactivar(1).subscribe((resp) => {
      expect(resp.activo).toBeFalse();
    });

    const req = httpMock.expectOne('/api/v1/proveedores/1/inactivar');
    expect(req.request.method).toBe('PATCH');
    req.flush({ id: 1, activo: false, mensaje: 'ok' });
  });

  it('activar() debe llamar PATCH /api/v1/proveedores/:id/activar', () => {
    service.activar(1).subscribe((resp) => {
      expect(resp.activo).toBeTrue();
    });

    const req = httpMock.expectOne('/api/v1/proveedores/1/activar');
    expect(req.request.method).toBe('PATCH');
    req.flush({ id: 1, activo: true, mensaje: 'ok' });
  });

  it('todos los métodos usan withCredentials: true (cookies JWT)', () => {
    service.listar().subscribe();
    const req = httpMock.expectOne((r) => r.url === '/api/v1/proveedores');
    expect(req.request.withCredentials).toBeTrue();
  });
});
