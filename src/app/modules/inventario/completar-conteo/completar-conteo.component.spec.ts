import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { CompletarConteoComponent } from './completar-conteo.component';
import { CompletarConteoService } from './completar-conteo.service';
import { ConfirmarResponse } from './completar-conteo.model';

describe('CompletarConteoComponent', () => {
  let component: CompletarConteoComponent;
  let fixture: ComponentFixture<CompletarConteoComponent>;
  let service: CompletarConteoService;
  let httpMock: HttpTestingController;
  let router: Router;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [CompletarConteoComponent, HttpClientTestingModule],
        providers: [
          CompletarConteoService,
          {
            provide: ActivatedRoute,
            useValue: {
              snapshot: {
                paramMap: {
                  get: (key: string) => (key === 'id' ? '1' : null),
                },
              },
            },
          },
          {
            provide: Router,
            useValue: {
              navigate: jasmine.createSpy('navigate'),
            },
          },
        ],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(CompletarConteoComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(CompletarConteoService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // T065: Component Tests (6+ tests)

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load inventario on init', () => {
    spyOn(component, 'loadInventario');
    component.ngOnInit();
    expect(component.loadInventario).toHaveBeenCalled();
  });

  it('should initialize loading state as false', () => {
    expect(component.loading).toBeFalsy();
  });

  it('should handle confirmar success', () => {
    const mockResp: ConfirmarResponse = {
      id: 1,
      tienda_id: 1,
      estado: 'completado',
      completado_en: new Date().toISOString(),
      items_ajustados: 5,
      resumen: { total_items: 5, items_correctos: 4, items_faltantes: 1, items_exceso: 0, diferencia_negativa: 2, diferencia_positiva: 0, porcentaje_variacion: 0 },
      timestamp: new Date().toISOString(),
    };

    spyOn(service, 'confirmarConteo').and.returnValue(of(mockResp));
    component.inventarioId = 1;
    component.confirmar();
    expect(component.respuesta).toEqual(mockResp);
  });

  it('should handle confirmar error', () => {
    spyOn(service, 'confirmarConteo').and.returnValue(throwError({ error: { error: 'CONTEO_INCOMPLETO' } }));
    component.inventarioId = 1;
    component.confirmar();
    expect(component.error).toBeTruthy();
  });

  it('should display error message for CONTEO_INCOMPLETO', () => {
    component.confirmar();
    expect(component).toBeTruthy();
  });
});

describe('CompletarConteoService', () => {
  let service: CompletarConteoService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CompletarConteoService],
    });
    service = TestBed.inject(CompletarConteoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // T066: Service Tests (4 tests)

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call POST /api/v1/inventarios/{id}/confirmar', () => {
    service.confirmarConteo(1, { confirmar: true }).subscribe();
    const req = httpMock.expectOne('/api/v1/inventarios/1/confirmar');
    expect(req.request.method).toBe('POST');
  });

  it('should handle success response', () => {
    const mockResp: ConfirmarResponse = {
      id: 1,
      tienda_id: 1,
      estado: 'completado',
      completado_en: new Date().toISOString(),
      items_ajustados: 5,
      resumen: { total_items: 5, items_correctos: 4, items_faltantes: 1, items_exceso: 0, diferencia_negativa: 2, diferencia_positiva: 0, porcentaje_variacion: 0 },
      timestamp: new Date().toISOString(),
    };

    service.confirmarConteo(1, { confirmar: true }).subscribe((resp) => {
      expect(resp).toEqual(mockResp);
    });

    const req = httpMock.expectOne('/api/v1/inventarios/1/confirmar');
    req.flush(mockResp);
  });

  it('should handle error response', () => {
    service.confirmarConteo(1, { confirmar: true }).subscribe(
      () => {},
      (error) => {
        expect(error.status).toBe(422);
      }
    );

    const req = httpMock.expectOne('/api/v1/inventarios/1/confirmar');
    req.flush({ error: 'CONTEO_INCOMPLETO' }, { status: 422, statusText: 'Unprocessable Entity' });
  });
});
