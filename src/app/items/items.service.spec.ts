import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import {
  ItemsService,
  Item,
  ItemDetalle,
  ListarItemsResponse,
  CrearItemRequest,
  HistorialCostosResponse,
} from './items.service';

const itemEjemplo: Item = {
  id: 1,
  codigo: 'LEC-001',
  nombre: 'Leche Entera',
  tipo: 'insumo',
  subcategoria_id: 3,
  subcategoria_nombre: 'Lácteos > Líquidos',
  proveedor_id: 2,
  proveedor_nombre: 'Distribuidora Norte',
  unidad_medida_id: 5,
  unidad_medida_simbolo: 'ml',
  costo_unitario: 3200,
  frecuencia_inventario: 'diario',
  stock_seguridad: '10000.0000',
  tiempo_entrega_dias: 2,
  activo: true,
  creado_por: 1,
  creado_en: '2026-05-24T10:00:00',
  actualizado_por: 1,
  actualizado_en: '2026-05-24T10:00:00',
};

const listaEjemplo: ListarItemsResponse = {
  items: [itemEjemplo],
  total: 1,
  pagina: 1,
  total_paginas: 1,
};

describe('ItemsService', () => {
  let service: ItemsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ItemsService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ItemsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('listarItems() debe llamar GET /api/v1/items con los query params correctos', () => {
    service
      .listarItems({ tipo: 'insumo', frecuencia: 'diario', activo: true, pagina: 1, por_pagina: 50 })
      .subscribe((resp) => {
        expect(resp.total).toBe(1);
      });

    const req = httpMock.expectOne(
      (r) =>
        r.url === '/api/v1/items' &&
        r.params.get('tipo') === 'insumo' &&
        r.params.get('frecuencia') === 'diario' &&
        r.params.get('activo') === 'true' &&
        r.params.get('pagina') === '1' &&
        r.params.get('por_pagina') === '50',
    );
    expect(req.request.method).toBe('GET');
    req.flush(listaEjemplo);
  });

  it('listarItems() sin params no envía query params opcionales', () => {
    service.listarItems().subscribe();
    const req = httpMock.expectOne((r) => r.url === '/api/v1/items');
    expect(req.request.params.keys().length).toBe(0);
    req.flush({ ...listaEjemplo, items: [] });
  });

  it('obtenerItem() debe llamar GET /api/v1/items/:id', () => {
    const detalle: ItemDetalle = { ...itemEjemplo, esta_en_uso: false };
    service.obtenerItem(1).subscribe((resp) => {
      expect(resp.esta_en_uso).toBeFalse();
    });

    const req = httpMock.expectOne('/api/v1/items/1');
    expect(req.request.method).toBe('GET');
    req.flush(detalle);
  });

  it('crearItem() debe llamar POST /api/v1/items con el body correcto', () => {
    const payload: CrearItemRequest = {
      codigo: 'LEC-001',
      nombre: 'Leche Entera',
      tipo: 'insumo',
      subcategoria_id: 3,
      unidad_medida_id: 5,
      frecuencia_inventario: 'diario',
      stock_seguridad: '10000.0000',
    };
    service.crearItem(payload).subscribe((resp) => {
      expect(resp.id).toBe(1);
    });

    const req = httpMock.expectOne('/api/v1/items');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({ ...itemEjemplo, esta_en_uso: false });
  });

  it('editarItem() debe llamar PUT /api/v1/items/:id con el código bloqueado si esta_en_uso', () => {
    service
      .editarItem(1, {
        nombre: 'Leche Entera',
        subcategoria_id: 3,
        unidad_medida_id: 5,
        frecuencia_inventario: 'diario',
        stock_seguridad: '10000.0000',
      })
      .subscribe((resp) => {
        expect(resp.id).toBe(1);
      });

    const req = httpMock.expectOne('/api/v1/items/1');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body.codigo).toBeUndefined();
    req.flush({ ...itemEjemplo, esta_en_uso: true });
  });

  it('inactivarItem() debe llamar PATCH /api/v1/items/:id/inactivar', () => {
    service.inactivarItem(1).subscribe((resp) => {
      expect(resp.activo).toBeFalse();
    });

    const req = httpMock.expectOne('/api/v1/items/1/inactivar');
    expect(req.request.method).toBe('PATCH');
    req.flush({ id: 1, codigo: 'LEC-001', nombre: 'Leche Entera', activo: false, actualizado_por: 1, actualizado_en: '2026-05-24T12:00:00' });
  });

  it('reactivarItem() debe llamar PATCH /api/v1/items/:id/reactivar', () => {
    service.reactivarItem(1).subscribe((resp) => {
      expect(resp.activo).toBeTrue();
    });

    const req = httpMock.expectOne('/api/v1/items/1/reactivar');
    expect(req.request.method).toBe('PATCH');
    req.flush({ id: 1, codigo: 'LEC-001', nombre: 'Leche Entera', activo: true, actualizado_por: 1, actualizado_en: '2026-05-24T13:00:00' });
  });

  it('registrarCostoTienda() debe llamar POST /api/v1/items/:id/costos_tienda', () => {
    service.registrarCostoTienda(1, { tienda_id: 1, costo_unitario: 3400 }).subscribe((resp) => {
      expect(resp.costo_unitario).toBe(3400);
    });

    const req = httpMock.expectOne('/api/v1/items/1/costos_tienda');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ tienda_id: 1, costo_unitario: 3400 });
    req.flush({ id: 5, item_id: 1, tienda_id: 1, costo_unitario: 3400, vigente_desde: '2026-05-20T09:00:00', creado_por: 1, creado_en: '2026-05-20T09:00:00' });
  });

  it('obtenerCostosTienda() debe llamar GET /api/v1/items/:id/costos_tienda y traer el costo vigente', () => {
    const historial: HistorialCostosResponse = {
      item_id: 1,
      costo_global: 3200,
      costos_por_tienda: [
        {
          tienda_id: 1,
          tienda_nombre: 'Sede Norte',
          costo_vigente: 3600,
          historial: [
            { id: 5, costo_unitario: 3600, vigente_desde: '2026-05-20T09:00:00', creado_por: 1, creado_en: '2026-05-20T09:00:00' },
            { id: 2, costo_unitario: 3200, vigente_desde: '2026-05-10T08:00:00', creado_por: 1, creado_en: '2026-05-10T08:00:00' },
          ],
        },
      ],
    };
    service.obtenerCostosTienda(1).subscribe((resp) => {
      expect(resp.costos_por_tienda[0].costo_vigente).toBe(3600);
      expect(resp.costos_por_tienda[0].historial.length).toBe(2);
    });

    const req = httpMock.expectOne('/api/v1/items/1/costos_tienda');
    expect(req.request.method).toBe('GET');
    req.flush(historial);
  });

  it('todos los métodos usan withCredentials: true (cookies JWT)', () => {
    service.listarItems().subscribe();
    const req = httpMock.expectOne((r) => r.url === '/api/v1/items');
    expect(req.request.withCredentials).toBeTrue();
  });
});
