import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import { NavConfigService } from './nav-config.service';
import { AuthService, SesionState } from '../../auth/auth.service';

function mockAuthService(sesion: SesionState | null) {
  return { sesion: signal<SesionState | null>(sesion) };
}

describe('NavConfigService', () => {
  let service: NavConfigService;

  function setup(sesion: SesionState | null) {
    TestBed.configureTestingModule({
      providers: [
        NavConfigService,
        { provide: AuthService, useValue: mockAuthService(sesion) },
      ],
    });
    service = TestBed.inject(NavConfigService);
  }

  it('debe crearse correctamente', () => {
    setup({ rol: 'admin', tienda_id: null });
    expect(service).toBeTruthy();
  });

  it('sesión nula devuelve lista vacía', () => {
    setup(null);
    expect(service.navItems()).toEqual([]);
  });

  it('admin recibe todos los 11 módulos', () => {
    setup({ rol: 'admin', tienda_id: null });
    expect(service.navItems().length).toBe(11);
  });

  it('admin recibe ítems en orden ascendente por orden', () => {
    setup({ rol: 'admin', tienda_id: null });
    const ordenes = service.navItems().map((i) => i.orden);
    expect(ordenes).toEqual([...ordenes].sort((a, b) => a - b));
  });

  it('lider_tienda recibe solo sus módulos autorizados', () => {
    setup({ rol: 'lider_tienda', tienda_id: 1 });
    const ids = service.navItems().map((i) => i.id);
    expect(ids).toContain('dashboard');
    expect(ids).toContain('inventario');
    expect(ids).toContain('mermas');
    expect(ids).toContain('pedidos');
    expect(ids).toContain('caja-menor');
    expect(ids).toContain('ventas');
    expect(ids).not.toContain('tiendas');
    expect(ids).not.toContain('empleados');
    expect(ids).toContain('catalogo');
    expect(ids).not.toContain('menu');
    expect(ids).not.toContain('demanda');
  });

  it('lider_tienda solo ve el hijo "items" dentro de Catálogo (categorías/proveedores/unidades son admin-only)', () => {
    setup({ rol: 'lider_tienda', tienda_id: 1 });
    const catalogo = service.navItems().find((i) => i.id === 'catalogo');
    const childIds = catalogo?.children?.map((c) => c.id) ?? [];
    expect(childIds).toEqual(['items']);
  });

  it('barista recibe solo sus módulos autorizados', () => {
    setup({ rol: 'barista', tienda_id: 2 });
    const ids = service.navItems().map((i) => i.id);
    expect(ids).toContain('dashboard');
    expect(ids).toContain('inventario');
    expect(ids).toContain('pedidos');
    expect(ids).not.toContain('mermas');
    expect(ids).not.toContain('tiendas');
  });

  it('lider_compras recibe dashboard, pedidos y demanda', () => {
    setup({ rol: 'lider_compras', tienda_id: null });
    const ids = service.navItems().map((i) => i.id);
    expect(ids).toContain('dashboard');
    expect(ids).toContain('pedidos');
    expect(ids).toContain('demanda');
    expect(ids).not.toContain('tiendas');
    expect(ids).not.toContain('inventario');
  });
});
