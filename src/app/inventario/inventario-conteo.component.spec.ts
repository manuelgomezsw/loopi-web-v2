import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { InventarioConteoComponent } from './inventario-conteo.component';
import { InventarioService, InventarioResp, ItemDetailResp } from './inventario.service';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';

const mockInventarioResp: InventarioResp = {
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

const mockItemResp: ItemDetailResp = {
  id: 1,
  item_id: 100,
  nombre: 'Item Test',
  unidad_medida: 'unidades',
  valor_sugerido: 10.0,
  valor_esperado: 10.0,
  valor_real: 12.5,
  diferencia: 2.5
};

const mockCompletedResp: InventarioResp = {
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

describe('InventarioConteoComponent', () => {
  let component: InventarioConteoComponent;
  let fixture: ComponentFixture<InventarioConteoComponent>;
  let inventarioService: jasmine.SpyObj<InventarioService>;

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('InventarioService', [
      'getSugerencia',
      'iniciarConteo',
      'registrarValorReal',
      'confirmarConteo',
      'getInventario',
      'getEstadoInventarioActivo'
    ]);

    await TestBed.configureTestingModule({
      imports: [InventarioConteoComponent],
      providers: [
        { provide: InventarioService, useValue: spy },
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

  it('should iniciar conteo', fakeAsync(() => {
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
    expect(component.step).toBe('register');
    expect(component.inventarioActual).toBe(mockInventarioResp);
  }));

  it('should handle error when iniciando conteo (409 duplicate)', fakeAsync(() => {
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
        error: { error: 'conteo_duplicado', mensaje: 'Ya existe un conteo en progreso para esta tienda, tipo y horario en esta fecha' }
      }))
    );

    component.iniciarConteo();
    tick();

    expect(component.iniciarConteoLoading).toBeFalsy();
    expect(component.iniciarConteoError).toBeTruthy();
    expect(component.step).toBe('select');
  }));

  it('should registrar valor with error recovery', () => {
    component.inventarioActual = mockInventarioResp;

    // MUST mock BEFORE calling method
    inventarioService.registrarValorReal.and.returnValue(of(mockItemResp));

    component.registrarValor(100, 12.5);

    expect(component.itemErrors.has(100)).toBeFalsy();
  });

  it('should handle registrar error with retry', () => {
    component.inventarioActual = mockInventarioResp;

    // MUST mock BEFORE calling method
    inventarioService.registrarValorReal.and.returnValue(
      throwError(() => ({
        error: { mensaje: 'Network error' }
      }))
    );

    component.registrarValor(100, 12.5);

    expect(component.itemErrors.has(100)).toBeTruthy();
  });

  it('should confirmar conteo', () => {
    // MUST mock BEFORE calling method
    inventarioService.confirmarConteo.and.returnValue(of(mockCompletedResp));

    component.inventarioActual = mockInventarioResp;
    component.confirmarConteo();

    expect(component.step).toBe('complete');
  });

  it('should handle items sin registrar error', () => {
    // MUST mock BEFORE calling method
    inventarioService.confirmarConteo.and.returnValue(
      throwError(() => ({
        status: 422,
        error: { error: 'items_sin_registrar', detalles: { items_sin_registrar: [100] } }
      }))
    );

    component.inventarioActual = mockInventarioResp;
    component.step = 'confirm';
    component.confirmarConteo();

    expect(component.itemsSinRegistrar.length).toBeGreaterThan(0);
  });
});
