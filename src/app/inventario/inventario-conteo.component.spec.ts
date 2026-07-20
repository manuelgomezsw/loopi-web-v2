import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { InventarioConteoComponent } from './inventario-conteo.component';
import { InventarioService } from './inventario.service';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

const mockInventarioResp = {
  id: 1,
  tienda_id: 1,
  fecha: '2026-07-13',
  tipo: 'diario',
  horario: 'apertura',
  estado: 'en_progreso',
  responsable_id: 10,
  iniciado_en: '2026-07-13T06:00:00',
  completado_en: undefined,
  items: [
    {
      id: 1,
      item_id: 100,
      nombre: 'Item Test',
      unidad_medida: 'unidades',
      valor_esperado: 10.0,
      valor_real: undefined,
      diferencia: undefined
    }
  ]
};

describe('InventarioConteoComponent', () => {
  let component: InventarioConteoComponent;
  let fixture: ComponentFixture<InventarioConteoComponent>;
  let inventarioService: jasmine.SpyObj<InventarioService>;

  beforeEach(async () => {
    const serviceSpy = jasmine.createSpyObj('InventarioService', [
      'getSugerencia',
      'iniciarConteo',
      'getInventario',
      'getEstadoInventarioActivo'
    ]);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [InventarioConteoComponent],
      providers: [
        { provide: InventarioService, useValue: serviceSpy },
        { provide: Router, useValue: routerSpy },
        {
          provide: ActivatedRoute,
          useValue: { queryParams: of({}) }
        }
      ]
    }).compileComponents();

    inventarioService = TestBed.inject(InventarioService) as jasmine.SpyObj<InventarioService>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InventarioConteoComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load sugerencia on init', () => {
    // MUST mock BEFORE change detection
    inventarioService.getSugerencia.and.returnValue(
      of({ tipo: 'diario', horario: 'apertura' })
    );
    fixture.detectChanges();
    expect(inventarioService.getSugerencia).toHaveBeenCalled();
  });

  it('should iniciar conteo and navigate to realizar-conteo', fakeAsync(() => {
    const router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    // Setup form with valid values
    component.formulario.patchValue({
      tipo: 'diario',
      horario: 'apertura'
    });

    // MUST mock BEFORE calling method
    inventarioService.getEstadoInventarioActivo.and.returnValue(of({ activo: false }));
    inventarioService.iniciarConteo.and.returnValue(of(mockInventarioResp));

    component.iniciarConteo();
    tick();

    expect(inventarioService.iniciarConteo).toHaveBeenCalled();
    // Feature 018 redirects to feature 019 (realizar-conteo) to register values
    expect(router.navigate).toHaveBeenCalledWith(['/inventario', 1, 'realizar']);
  }));

  it('should handle error when iniciando conteo', fakeAsync(() => {
    // Setup form with valid values
    component.formulario.patchValue({
      tipo: 'diario',
      horario: 'apertura'
    });

    // Mock estado check
    inventarioService.getEstadoInventarioActivo.and.returnValue(of({ activo: false }));

    // Mock error response
    inventarioService.iniciarConteo.and.returnValue(
      throwError(() => ({
        status: 409,
        error: { error: 'conteo_duplicado', mensaje: 'Ya existe un conteo en progreso' }
      }))
    );

    component.iniciarConteo();
    tick();

    expect(component.iniciarConteoLoading).toBeFalsy();
    expect(component.iniciarConteoError).toBeTruthy();
  }));
});
