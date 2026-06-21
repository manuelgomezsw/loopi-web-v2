import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { ShellComponent } from './shell.component';
import { AuthService, SesionState } from '../../../auth/auth.service';
import { StoreContextService } from '../../services/store-context.service';
import { NavConfigService } from '../../services/nav-config.service';

const sesionAdmin: SesionState = { rol: 'admin', tienda_id: null };
const sesionSignal = signal<SesionState | null>(sesionAdmin);

describe('ShellComponent', () => {
  let fixture: ComponentFixture<ShellComponent>;
  let component: ShellComponent;
  let mockStoreCtx: jasmine.SpyObj<StoreContextService>;

  beforeEach(async () => {
    mockStoreCtx = jasmine.createSpyObj('StoreContextService', ['initFromSession'], {
      context: signal({ tienda_id: null, nombre: null }),
    });

    await TestBed.configureTestingModule({
      imports: [ShellComponent, HttpClientTestingModule],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: { sesion: sesionSignal, logout: jasmine.createSpy('logout').and.returnValue({ subscribe: jasmine.createSpy('subscribe') }) },
        },
        { provide: StoreContextService, useValue: mockStoreCtx },
        { provide: NavConfigService, useValue: { navItems: signal([]) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ShellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('sidebarOpen inicia en false', () => {
    expect(component.sidebarOpen()).toBeFalse();
  });

  it('toggleSidebar cambia sidebarOpen a true', () => {
    component.toggleSidebar();
    expect(component.sidebarOpen()).toBeTrue();
  });

  it('toggleSidebar doble vuelve a false', () => {
    component.toggleSidebar();
    component.toggleSidebar();
    expect(component.sidebarOpen()).toBeFalse();
  });

  it('closeSidebar establece sidebarOpen en false', () => {
    component.toggleSidebar();
    component.closeSidebar();
    expect(component.sidebarOpen()).toBeFalse();
  });

  it('ngOnInit llama initFromSession con la sesión activa', () => {
    expect(mockStoreCtx.initFromSession).toHaveBeenCalledWith(sesionAdmin);
  });

  it('renderiza app-topbar y app-sidebar', () => {
    const topbar = fixture.nativeElement.querySelector('app-topbar');
    const sidebar = fixture.nativeElement.querySelector('app-sidebar');
    expect(topbar).toBeTruthy();
    expect(sidebar).toBeTruthy();
  });
});
