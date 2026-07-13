import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InventarioHistorialComponent } from './inventario-historial.component';
import { InventarioService, InventarioResp } from './inventario.service';
import { AuthService } from '../auth/auth.service';
import { Router } from '@angular/router';
import { of } from 'rxjs';

const mockInventario: InventarioResp = {
  id: 1,
  tienda_id: 1,
  fecha: '2026-07-13',
  tipo: 'diario',
  horario: 'apertura',
  estado: 'completado',
  responsable_id: 10,
  iniciado_en: '2026-07-13T06:00:00',
  completado_en: '2026-07-13T07:00:00',
  items: []
};

describe('InventarioHistorialComponent', () => {
  let component: InventarioHistorialComponent;
  let fixture: ComponentFixture<InventarioHistorialComponent>;
  let inventarioService: jasmine.SpyObj<InventarioService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const serviceSpy = jasmine.createSpyObj('InventarioService', ['getHistorial', 'eliminarConteo']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const authServiceSpy = jasmine.createSpyObj('AuthService', [], {
      sesion: () => ({ rol: 'admin', tienda_id: 1 })
    });

    await TestBed.configureTestingModule({
      imports: [InventarioHistorialComponent],
      providers: [
        { provide: InventarioService, useValue: serviceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: AuthService, useValue: authServiceSpy }
      ]
    }).compileComponents();

    inventarioService = TestBed.inject(InventarioService) as jasmine.SpyObj<InventarioService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InventarioHistorialComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should cargar historial on init', () => {
    // MUST mock BEFORE calling any method
    inventarioService.getHistorial.and.returnValue(
      of({ inventarios: [mockInventario], total: 1, pagina: 1, total_paginas: 1 })
    );

    component.cargarHistorial();

    expect(inventarioService.getHistorial).toHaveBeenCalled();
  });

  it('should filter by tipo', () => {
    // MUST mock BEFORE calling any method
    inventarioService.getHistorial.and.returnValue(
      of({ inventarios: [mockInventario], total: 1, pagina: 1, total_paginas: 1 })
    );

    component.filtros.tipo = 'diario';
    component.aplicarFiltros();

    expect(inventarioService.getHistorial).toHaveBeenCalled();
  });

  it('should filter by estado', () => {
    // MUST mock BEFORE calling any method
    inventarioService.getHistorial.and.returnValue(
      of({ inventarios: [mockInventario], total: 1, pagina: 1, total_paginas: 1 })
    );

    component.filtros.estado = 'completado';
    component.aplicarFiltros();

    expect(inventarioService.getHistorial).toHaveBeenCalled();
  });

  it('should navigate to detalle on verDetalle', () => {
    component.verDetalle(123);
    expect(router.navigate).toHaveBeenCalledWith(['/inventario/detalle', 123]);
  });

  it('should cambiar pagina', () => {
    // MUST initialize totalPaginas BEFORE (cambiarPagina checks pagina <= totalPaginas)
    component.totalPaginas = 5;

    // MUST mock BEFORE calling any method
    inventarioService.getHistorial.and.returnValue(
      of({ inventarios: [mockInventario], total: 100, pagina: 2, total_paginas: 5 })
    );

    component.cambiarPagina(2);

    expect(component.paginaActual).toBe(2);
    expect(inventarioService.getHistorial).toHaveBeenCalled();
  });

  it('should limpiar filtros', () => {
    // MUST mock BEFORE calling any method that calls cargarHistorial
    inventarioService.getHistorial.and.returnValue(
      of({ inventarios: [], total: 0, pagina: 1, total_paginas: 0 })
    );

    component.filtros.tipo = 'diario';
    component.filtros.estado = 'completado';

    component.limpiarFiltros();

    expect(component.filtros.tipo).toBe('');
    expect(component.filtros.estado).toBe('');
  });

  it('should eliminar conteo with confirmation', () => {
    component.userRole = 'admin';
    component.inventarios = [{ ...mockInventario, id: 1, estado: 'en_progreso' }];
    component.total = 1;

    // MUST mock BEFORE calling any method
    inventarioService.eliminarConteo.and.returnValue(of(void 0));
    spyOn(window, 'confirm').and.returnValue(true);

    component.eliminarConteo(component.inventarios[0]);

    expect(inventarioService.eliminarConteo).toHaveBeenCalledWith(1);
    expect(component.inventarios.length).toBe(0);
  });

  it('should not eliminar if not admin', () => {
    component.userRole = 'barista';
    component.inventarios = [{ ...mockInventario, estado: 'en_progreso' }];

    const invToDelete = component.inventarios[0];
    const result = component.puedeEliminar(invToDelete);

    expect(result).toBeFalsy();
  });
});
