import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { TiendasListaComponent } from './tiendas-lista.component';
import { TiendasService, TiendaResponse, ListaTiendasResponse } from '../tiendas.service';

const tiendaActiva: TiendaResponse = {
  id: 1,
  codigo: 'TDA-001',
  nombre: 'Tienda Norte',
  direccion: 'Calle 100',
  ciudad: 'Bogotá',
  telefono: '300',
  activo: true,
  creado_por: 1,
  creado_en: '2026-05-23T10:00:00',
  actualizado_por: 1,
  actualizado_en: '2026-05-23T10:00:00',
};

const tiendaInactiva: TiendaResponse = { ...tiendaActiva, id: 2, nombre: 'Tienda Sur', activo: false };

const listaConTiendas: ListaTiendasResponse = {
  datos: [tiendaActiva, tiendaInactiva],
  total: 2,
  pagina: 1,
  limite: 50,
};

const listaVacia: ListaTiendasResponse = { datos: [], total: 0, pagina: 1, limite: 50 };

describe('TiendasListaComponent', () => {
  let fixture: ComponentFixture<TiendasListaComponent>;
  let component: TiendasListaComponent;
  let serviceSpy: jasmine.SpyObj<TiendasService>;
  let router: Router;

  beforeEach(async () => {
    serviceSpy = jasmine.createSpyObj('TiendasService', ['listar']);
    serviceSpy.listar.and.returnValue(of(listaVacia));

    await TestBed.configureTestingModule({
      imports: [TiendasListaComponent],
      providers: [
        provideRouter([]),
        { provide: TiendasService, useValue: serviceSpy },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(TiendasListaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  // --- ngOnInit ---

  it('llama a listar() en ngOnInit con filtro "activo"', () => {
    expect(serviceSpy.listar).toHaveBeenCalledWith('activo', 1, 50);
  });

  // --- navegación ---

  it('irAEditar() navega a la ruta de edición', () => {
    const navSpy = spyOn(router, 'navigate');
    component.irAEditar(1);
    expect(navSpy).toHaveBeenCalledWith(['/tiendas', 1, 'editar']);
  });

  it('clic en fila navega a editar', () => {
    serviceSpy.listar.and.returnValue(of(listaConTiendas));
    component.cargarTiendas();
    fixture.detectChanges();

    const navSpy = spyOn(router, 'navigate');
    const fila = fixture.nativeElement.querySelector('tbody tr');
    fila.click();
    expect(navSpy).toHaveBeenCalledWith(['/tiendas', tiendaActiva.id, 'editar']);
  });

  // --- estado vacío ---

  it('muestra bloque de estado vacío cuando no hay tiendas', () => {
    expect(fixture.nativeElement.textContent).toContain('No hay tiendas');
  });

  it('no muestra tabla cuando la lista está vacía', () => {
    expect(fixture.nativeElement.querySelector('table')).toBeNull();
  });

  // --- tabla con datos ---

  it('muestra tabla cuando hay tiendas', () => {
    serviceSpy.listar.and.returnValue(of(listaConTiendas));
    component.cargarTiendas();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('table')).toBeTruthy();
  });

  it('renderiza una fila por tienda', () => {
    serviceSpy.listar.and.returnValue(of(listaConTiendas));
    component.cargarTiendas();
    fixture.detectChanges();

    const filas = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(filas.length).toBe(2);
  });

  it('muestra badge "Activa" para tiendas activas', () => {
    serviceSpy.listar.and.returnValue(of({ ...listaConTiendas, datos: [tiendaActiva] }));
    component.cargarTiendas();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Activa');
  });

  it('muestra badge "Inactiva" para tiendas inactivas', () => {
    serviceSpy.listar.and.returnValue(of({ ...listaConTiendas, datos: [tiendaInactiva] }));
    component.cargarTiendas();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Inactiva');
  });

  // --- filtro de estado ---

  it('onFilters() relanza listar() con el nuevo estado', () => {
    serviceSpy.listar.and.returnValue(of(listaVacia));
    component.onFilters({ estado: 'activo' });
    expect(serviceSpy.listar).toHaveBeenCalledWith('activo', 1, 50);
  });

  it('onFilters() resetea pagina a 1', () => {
    component.pagina.set(3);
    serviceSpy.listar.and.returnValue(of(listaVacia));
    component.onFilters({ estado: 'inactivo' });
    expect(component.pagina()).toBe(1);
  });

  it('onFilters() con estado "inactivo" llama a listar() con ese estado', () => {
    serviceSpy.listar.and.returnValue(of(listaVacia));
    component.onFilters({ estado: 'inactivo' });
    expect(serviceSpy.listar).toHaveBeenCalledWith('inactivo', 1, 50);
  });

  // --- error en carga ---

  it('muestra mensaje de error cuando el servicio falla', () => {
    serviceSpy.listar.and.returnValue(throwError(() => new Error('network error')));
    component.cargarTiendas();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Error al cargar');
  });
});
