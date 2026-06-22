import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';

import { CategoriasService } from './categorias.service';

describe('CategoriasService', () => {
  let service: CategoriasService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CategoriasService],
    });
    service = TestBed.inject(CategoriasService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('obtenerCatalogo — sin filtro envía GET sin params', () => {
    service.obtenerCatalogo().subscribe();
    const req = http.expectOne('/api/v1/categorias');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.has('estado')).toBeFalse();
    req.flush({ categorias: [], total: 0 });
  });

  it('obtenerCatalogo — con estado=activo pasa el param', () => {
    service.obtenerCatalogo('activo').subscribe();
    const req = http.expectOne('/api/v1/categorias?estado=activo');
    expect(req.request.params.get('estado')).toBe('activo');
    req.flush({ categorias: [], total: 0 });
  });

  it('obtenerCatalogo — estado=todos NO envía el param', () => {
    service.obtenerCatalogo('todos').subscribe();
    const req = http.expectOne('/api/v1/categorias');
    expect(req.request.params.has('estado')).toBeFalse();
    req.flush({ categorias: [], total: 0 });
  });

  it('crearCategoria — POST a /api/v1/categorias con nombre', () => {
    service.crearCategoria('Lácteo').subscribe();
    const req = http.expectOne('/api/v1/categorias');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ nombre: 'Lácteo' });
    req.flush({ id: 1, nombre: 'Lácteo', activo: true, subcategorias: [] });
  });

  it('editarCategoria — PUT a /api/v1/categorias/:id', () => {
    service.editarCategoria(1, 'Nuevo').subscribe();
    const req = http.expectOne('/api/v1/categorias/1');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ nombre: 'Nuevo' });
    req.flush({ id: 1, nombre: 'Nuevo', activo: true });
  });

  it('inactivarCategoria — PATCH a /api/v1/categorias/:id/inactivar', () => {
    service.inactivarCategoria(2).subscribe();
    const req = http.expectOne('/api/v1/categorias/2/inactivar');
    expect(req.request.method).toBe('PATCH');
    req.flush({ id: 2, activo: false, subcategorias_inactivadas: 1 });
  });

  it('reactivarCategoria — PATCH a /api/v1/categorias/:id/reactivar', () => {
    service.reactivarCategoria(2).subscribe();
    const req = http.expectOne('/api/v1/categorias/2/reactivar');
    expect(req.request.method).toBe('PATCH');
    req.flush({ id: 2, activo: true });
  });

  it('crearSubcategoria — POST a /api/v1/subcategorias con nombre y categoria_id', () => {
    service.crearSubcategoria('Quesos', 3).subscribe();
    const req = http.expectOne('/api/v1/subcategorias');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ nombre: 'Quesos', categoria_id: 3 });
    req.flush({ id: 5, nombre: 'Quesos', categoria_id: 3, activo: true });
  });

  it('inactivarSubcategoria — PATCH a /api/v1/subcategorias/:id/inactivar', () => {
    service.inactivarSubcategoria(5).subscribe();
    const req = http.expectOne('/api/v1/subcategorias/5/inactivar');
    expect(req.request.method).toBe('PATCH');
    req.flush({ id: 5, activo: false });
  });

  it('reactivarSubcategoria — PATCH a /api/v1/subcategorias/:id/reactivar', () => {
    service.reactivarSubcategoria(5).subscribe();
    const req = http.expectOne('/api/v1/subcategorias/5/reactivar');
    expect(req.request.method).toBe('PATCH');
    req.flush({ id: 5, activo: true });
  });

  it('impactoCategoria — GET a /api/v1/categorias/:id/impacto', () => {
    service.impactoCategoria(1).subscribe();
    const req = http.expectOne('/api/v1/categorias/1/impacto');
    expect(req.request.method).toBe('GET');
    req.flush({ subcategorias_activas: 3 });
  });
});
