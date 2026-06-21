import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';

import { TopbarComponent } from './topbar.component';
import { AuthService, SesionState } from '../../../../auth/auth.service';
import { StoreContextService } from '../../../services/store-context.service';
import { HttpClient } from '@angular/common/http';

function makeAuth(sesion: SesionState | null) {
  return {
    sesion: signal<SesionState | null>(sesion),
    logout: jasmine.createSpy('logout').and.returnValue({ subscribe: () => {} }),
  };
}

describe('TopbarComponent', () => {
  let fixture: ComponentFixture<TopbarComponent>;
  let component: TopbarComponent;

  async function setup(sesion: SesionState | null) {
    await TestBed.configureTestingModule({
      imports: [TopbarComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: makeAuth(sesion) },
        {
          provide: StoreContextService,
          useValue: {
            context: signal({ tienda_id: null, nombre: null }),
            initFromSession: () => {},
            setTienda: () => {},
          },
        },
        { provide: HttpClient, useValue: { get: () => ({ subscribe: () => {} }) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TopbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('debe crearse correctamente', async () => {
    await setup({ rol: 'admin', tienda_id: null });
    expect(component).toBeTruthy();
  });

  it('admin: muestra app-store-selector', async () => {
    await setup({ rol: 'admin', tienda_id: null });
    const selector = fixture.nativeElement.querySelector('app-store-selector');
    expect(selector).toBeTruthy();
  });

  it('lider_tienda: NO muestra app-store-selector', async () => {
    await setup({ rol: 'lider_tienda', tienda_id: 3 });
    const selector = fixture.nativeElement.querySelector('app-store-selector');
    expect(selector).toBeNull();
  });

  it('barista: NO muestra app-store-selector', async () => {
    await setup({ rol: 'barista', tienda_id: 2 });
    const selector = fixture.nativeElement.querySelector('app-store-selector');
    expect(selector).toBeNull();
  });

  it('botón hamburguesa tiene clase sm:hidden', async () => {
    await setup({ rol: 'admin', tienda_id: null });
    const btn = fixture.nativeElement.querySelector('button[aria-label="Abrir menú"]');
    expect(btn?.className).toContain('sm:hidden');
  });

  it('emite menuToggled al pulsar el botón hamburguesa', async () => {
    await setup({ rol: 'admin', tienda_id: null });
    let emitted = false;
    component.menuToggled.subscribe(() => (emitted = true));
    const btn = fixture.nativeElement.querySelector('button[aria-label="Abrir menú"]');
    btn?.click();
    expect(emitted).toBeTrue();
  });

  it('botón hamburguesa refleja sidebarOpen en aria-expanded', async () => {
    await setup({ rol: 'admin', tienda_id: null });
    component.sidebarOpen = true;
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('button[aria-label="Abrir menú"]');
    expect(btn?.getAttribute('aria-expanded')).toBe('true');
  });
});
