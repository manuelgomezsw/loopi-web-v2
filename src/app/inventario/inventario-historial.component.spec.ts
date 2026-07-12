import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InventarioHistorialComponent } from './inventario-historial.component';
import { InventarioService } from './inventario.service';
import { Router } from '@angular/router';
import { of } from 'rxjs';

describe('InventarioHistorialComponent', () => {
  let component: InventarioHistorialComponent;
  let fixture: ComponentFixture<InventarioHistorialComponent>;
  let inventarioService: jasmine.SpyObj<InventarioService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const serviceSpy = jasmine.createSpyObj('InventarioService', ['getHistorial']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      declarations: [InventarioHistorialComponent],
      providers: [
        { provide: InventarioService, useValue: serviceSpy },
        { provide: Router, useValue: routerSpy }
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
    inventarioService.getHistorial.and.returnValue(
      of({ inventarios: [], total: 0, pagina: 1, total_paginas: 0 })
    );
    component.cargarHistorial();
    expect(inventarioService.getHistorial).toHaveBeenCalled();
  });

  it('should filter by tipo', () => {
    inventarioService.getHistorial.and.returnValue(
      of({ inventarios: [], total: 0, pagina: 1, total_paginas: 0 })
    );

    component.filtros.tipo = 'diario';
    component.aplicarFiltros();

    expect(inventarioService.getHistorial).toHaveBeenCalled();
  });

  it('should filter by estado', () => {
    inventarioService.getHistorial.and.returnValue(
      of({ inventarios: [], total: 0, pagina: 1, total_paginas: 0 })
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
    inventarioService.getHistorial.and.returnValue(
      of({ inventarios: [], total: 100, pagina: 2, total_paginas: 5 })
    );

    component.cambiarPagina(2);

    expect(component.paginaActual).toBe(2);
    expect(inventarioService.getHistorial).toHaveBeenCalled();
  });

  it('should limpiar filtros', () => {
    component.filtros.tipo = 'diario';
    component.filtros.estado = 'completado';

    component.limpiarFiltros();

    expect(component.filtros.tipo).toBeUndefined();
    expect(component.filtros.estado).toBeUndefined();
  });
});
