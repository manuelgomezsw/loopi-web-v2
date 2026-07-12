import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InventarioConteoComponent } from './inventario-conteo.component';
import { InventarioService } from './inventario.service';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';

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
      'getInventario'
    ]);

    await TestBed.configureTestingModule({
      declarations: [InventarioConteoComponent],
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
    inventarioService.getSugerencia.and.returnValue(
      of({ tipo: 'diario', horario: 'apertura' })
    );
    fixture.detectChanges();
    expect(inventarioService.getSugerencia).toHaveBeenCalled();
  });

  it('should iniciar conteo', () => {
    const mockResp = {
      id: 1,
      tienda_id: 1,
      tipo: 'diario',
      horario: 'apertura',
      estado: 'en_progreso',
      items: []
    };
    inventarioService.iniciarConteo.and.returnValue(of(mockResp));

    component.iniciarConteo();

    expect(inventarioService.iniciarConteo).toHaveBeenCalled();
    expect(component.step).toBe('register');
  });

  it('should registrar valor with error recovery', () => {
    const valorReal = 12.5;
    component.inventarioActual = {
      id: 1,
      tienda_id: 1,
      items: [{ item_id: 1, valor_real: null }]
    };

    inventarioService.registrarValorReal.and.returnValue(
      of({ id: 1, item_id: 1, valor_real: valorReal, diferencia: 2.5 })
    );

    component.registrarValor(1, valorReal);

    expect(component.itemErrors.has(1)).toBeFalsy();
    expect(component.loadingItems.has(1)).toBeFalsy();
  });

  it('should handle registrar error with retry', () => {
    component.inventarioActual = {
      id: 1,
      tienda_id: 1,
      items: [{ item_id: 1, valor_real: null }]
    };

    inventarioService.registrarValorReal.and.returnValue(
      throwError(() => ({
        error: { mensaje: 'Network error' }
      }))
    );

    component.registrarValor(1, 12.5);

    expect(component.itemErrors.has(1)).toBeTruthy();
  });

  it('should confirmar conteo', () => {
    const mockResp = {
      id: 1,
      tienda_id: 1,
      estado: 'completado',
      completado_en: new Date()
    };
    inventarioService.confirmarConteo.and.returnValue(of(mockResp));

    component.inventarioActual = { id: 1, tienda_id: 1 };
    component.confirmarConteo();

    expect(component.step).toBe('complete');
  });

  it('should handle items sin registrar error', () => {
    inventarioService.confirmarConteo.and.returnValue(
      throwError(() => ({
        status: 422,
        error: { error: 'items_sin_registrar', detalles: { items_sin_registrar: [1, 2] } }
      }))
    );

    component.inventarioActual = { id: 1, tienda_id: 1 };
    component.step = 'confirm';
    component.confirmarConteo();

    expect(component.itemsSinRegistrar.length).toBeGreaterThan(0);
  });
});
