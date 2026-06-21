import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { signal } from '@angular/core';

import { StoreSelectorComponent } from './store-selector.component';
import { StoreContextService } from '../../../services/store-context.service';
import { StoreContext, TiendaOpcion } from '../../../models/nav.types';

const TIENDAS: TiendaOpcion[] = [
  { id: 1, nombre: 'Tienda Norte', codigo: 'TN01' },
  { id: 2, nombre: 'Tienda Sur', codigo: 'TS01' },
];

const API_URL = '/api/v1/tiendas?estado=activo&pagina=1&limite=100';

describe('StoreSelectorComponent', () => {
  let fixture: ComponentFixture<StoreSelectorComponent>;
  let component: StoreSelectorComponent;
  let httpMock: HttpTestingController;
  let mockContext: ReturnType<typeof signal<StoreContext>>;
  let mockStoreCtx: jasmine.SpyObj<StoreContextService>;

  beforeEach(async () => {
    mockContext = signal<StoreContext>({ tienda_id: null, nombre: null });
    mockStoreCtx = jasmine.createSpyObj('StoreContextService', ['setTienda'], {
      context: mockContext,
    });

    await TestBed.configureTestingModule({
      imports: [StoreSelectorComponent, HttpClientTestingModule],
      providers: [{ provide: StoreContextService, useValue: mockStoreCtx }],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(StoreSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
    httpMock.expectOne(API_URL).flush({ datos: TIENDAS, total: 2 });
  });

  it('muestra spinner mientras carga', () => {
    const spinner = fixture.nativeElement.querySelector('[aria-busy="true"]');
    expect(spinner).toBeTruthy();
    httpMock.expectOne(API_URL).flush({ datos: TIENDAS, total: 2 });
  });

  it('llama al endpoint correcto con params estado=activo', () => {
    const req = httpMock.expectOne(API_URL);
    expect(req.request.method).toBe('GET');
    req.flush({ datos: TIENDAS, total: 2 });
  });

  it('carga tiendas desde res.datos (formato real del API)', () => {
    httpMock.expectOne(API_URL).flush({ datos: TIENDAS, total: 2 });
    fixture.detectChanges();

    expect(component.tiendas()).toEqual(TIENDAS);
    expect(component.cargando()).toBeFalse();
  });

  it('renderiza Vista consolidada como primera opción', () => {
    httpMock.expectOne(API_URL).flush({ datos: TIENDAS, total: 2 });
    fixture.detectChanges();

    const options = fixture.nativeElement.querySelectorAll('option');
    expect(options[0].textContent.trim()).toBe('Vista consolidada');
    expect(options[0].value).toBe('');
  });

  it('renderiza las tiendas como opciones', () => {
    httpMock.expectOne(API_URL).flush({ datos: TIENDAS, total: 2 });
    fixture.detectChanges();

    const options = fixture.nativeElement.querySelectorAll('option');
    expect(options.length).toBe(3); // consolidada + 2 tiendas
  });

  it('al seleccionar una tienda llama setTienda con la tienda correcta', () => {
    httpMock.expectOne(API_URL).flush({ datos: TIENDAS, total: 2 });
    fixture.detectChanges();

    const select: HTMLSelectElement = fixture.nativeElement.querySelector('select');
    select.value = '1';
    select.dispatchEvent(new Event('change'));

    expect(mockStoreCtx.setTienda).toHaveBeenCalledWith(TIENDAS[0]);
  });

  it('al seleccionar Vista consolidada llama setTienda con null', () => {
    httpMock.expectOne(API_URL).flush({ datos: TIENDAS, total: 2 });
    fixture.detectChanges();

    const select: HTMLSelectElement = fixture.nativeElement.querySelector('select');
    select.value = '';
    select.dispatchEvent(new Event('change'));

    expect(mockStoreCtx.setTienda).toHaveBeenCalledWith(null);
  });

  it('muestra error y botón Reintentar cuando la carga falla', () => {
    httpMock.expectOne(API_URL).flush(
      { message: 'error' },
      { status: 500, statusText: 'Server Error' },
    );
    fixture.detectChanges();

    expect(component.error()).toBeTrue();
    const btn = fixture.nativeElement.querySelector('button');
    expect(btn?.textContent?.trim()).toBe('Reintentar');
  });

  it('Reintentar vuelve a llamar a la API', () => {
    httpMock.expectOne(API_URL).flush({}, { status: 500, statusText: 'Error' });
    fixture.detectChanges();

    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    btn.click();

    httpMock.expectOne(API_URL).flush({ datos: TIENDAS, total: 2 });
    fixture.detectChanges();
    expect(component.tiendas().length).toBe(2);
  });
});
