import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { signal } from '@angular/core';

import { roleGuard } from './role.guard';
import { AuthService, SesionState } from '../../auth/auth.service';
import { Rol } from '../../shared/models/nav.types';

function mockAuthService(sesion: SesionState | null) {
  return { sesion: signal<SesionState | null>(sesion) };
}

function runGuard(allowedRoles: Rol[], sesion: SesionState | null): unknown {
  TestBed.configureTestingModule({
    providers: [
      { provide: AuthService, useValue: mockAuthService(sesion) },
      {
        provide: Router,
        useValue: {
          createUrlTree: (commands: string[]) => commands,
        },
      },
    ],
  });

  return TestBed.runInInjectionContext(() =>
    roleGuard(allowedRoles)({} as never, {} as never),
  );
}

describe('roleGuard', () => {
  it('sin sesión redirige a /login', () => {
    const result = runGuard(['admin'], null);
    expect(result as string[]).toEqual(['/login']);
  });

  it('rol autorizado retorna true', () => {
    expect(runGuard(['admin'], { rol: 'admin', tienda_id: null })).toBe(true);
  });

  it('admin en ruta solo-admin retorna true', () => {
    expect(runGuard(['admin'], { rol: 'admin', tienda_id: null })).toBe(true);
  });

  it('lider_tienda en ruta solo-admin redirige a /inventario', () => {
    expect(runGuard(['admin'], { rol: 'lider_tienda', tienda_id: 1 }) as string[]).toEqual(
      ['/inventario'],
    );
  });

  it('barista en ruta solo-admin redirige a /inventario', () => {
    expect(runGuard(['admin'], { rol: 'barista', tienda_id: 2 }) as string[]).toEqual(
      ['/inventario'],
    );
  });

  it('lider_compras en ruta solo-admin redirige a /pedidos', () => {
    expect(
      runGuard(['admin'], { rol: 'lider_compras', tienda_id: null }) as string[],
    ).toEqual(['/pedidos']);
  });

  it('lider_tienda en ruta multi-rol autorizada retorna true', () => {
    expect(
      runGuard(['admin', 'lider_tienda', 'barista'], { rol: 'lider_tienda', tienda_id: 1 }),
    ).toBe(true);
  });

  it('barista en ruta con todos los roles retorna true', () => {
    expect(
      runGuard(
        ['admin', 'lider_compras', 'lider_tienda', 'barista'],
        { rol: 'barista', tienda_id: 3 },
      ),
    ).toBe(true);
  });
});
