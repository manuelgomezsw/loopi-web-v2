import { TestBed } from '@angular/core/testing';

import { StoreContextService } from './store-context.service';
import { SesionState } from '../../auth/auth.service';
import { TiendaOpcion } from '../models/nav.types';

describe('StoreContextService', () => {
  let service: StoreContextService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StoreContextService);
  });

  it('debe crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  describe('contexto inicial', () => {
    it('debe ser vista consolidada por defecto', () => {
      expect(service.context()).toEqual({ tienda_id: null, nombre: null });
    });
  });

  describe('initFromSession', () => {
    it('admin inicia en vista consolidada', () => {
      const sesion: SesionState = { rol: 'admin', tienda_id: null };
      service.initFromSession(sesion);
      expect(service.context()).toEqual({ tienda_id: null, nombre: null });
    });

    it('lider_compras inicia en vista consolidada', () => {
      const sesion: SesionState = { rol: 'lider_compras', tienda_id: null };
      service.initFromSession(sesion);
      expect(service.context()).toEqual({ tienda_id: null, nombre: null });
    });

    it('lider_tienda fija el contexto con su tienda_id', () => {
      const sesion: SesionState = { rol: 'lider_tienda', tienda_id: 5 };
      service.initFromSession(sesion);
      expect(service.context()).toEqual({ tienda_id: 5, nombre: null });
    });

    it('barista fija el contexto con su tienda_id', () => {
      const sesion: SesionState = { rol: 'barista', tienda_id: 3 };
      service.initFromSession(sesion);
      expect(service.context()).toEqual({ tienda_id: 3, nombre: null });
    });
  });

  describe('setTienda', () => {
    beforeEach(() => {
      service.initFromSession({ rol: 'admin', tienda_id: null });
    });

    it('admin puede cambiar el contexto a una tienda', () => {
      const tienda: TiendaOpcion = { id: 2, nombre: 'Tienda Norte', codigo: 'TN01' };
      service.setTienda(tienda);
      expect(service.context()).toEqual({ tienda_id: 2, nombre: 'Tienda Norte' });
    });

    it('admin puede volver a vista consolidada con null', () => {
      service.setTienda({ id: 2, nombre: 'Tienda Norte', codigo: 'TN01' });
      service.setTienda(null);
      expect(service.context()).toEqual({ tienda_id: null, nombre: null });
    });

    it('lider_tienda no puede cambiar el contexto', () => {
      service.initFromSession({ rol: 'lider_tienda', tienda_id: 5 });
      service.setTienda({ id: 9, nombre: 'Otra Tienda', codigo: 'OT01' });
      expect(service.context()).toEqual({ tienda_id: 5, nombre: null });
    });

    it('barista no puede cambiar el contexto', () => {
      service.initFromSession({ rol: 'barista', tienda_id: 3 });
      service.setTienda({ id: 9, nombre: 'Otra Tienda', codigo: 'OT01' });
      expect(service.context()).toEqual({ tienda_id: 3, nombre: null });
    });
  });
});
