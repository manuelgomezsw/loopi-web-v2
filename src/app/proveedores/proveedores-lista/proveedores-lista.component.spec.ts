import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { ProveedoresListaComponent } from './proveedores-lista.component';
import { ProveedoresService, Proveedor, ListarProveedoresResponse } from '../proveedores.service';

const proveedorActivo: Proveedor = {
  id: 1,
  razon_social: 'Distribuidora La Cosecha S.A.S',
  nit: '900123456-7',
  nombre_contacto: 'Carlos Rodríguez',
  telefono_contacto: '3001234567',
  email_contacto: 'carlos@lacosecha.com',
  activo: true,
  creado_en: '2026-05-24T10:00:00',
  actualizado_en: '2026-05-24T10:00:00',
};

const proveedorInactivo: Proveedor = { ...proveedorActivo, id: 2, razon_social: 'Proveedor Simple', activo: false };

const listaConProveedores: ListarProveedoresResponse = {
  proveedores: [proveedorActivo, proveedorInactivo],
  total: 2,
  page: 1,
  limit: 50,
};

const listaVacia: ListarProveedoresResponse = { proveedores: [], total: 0, page: 1, limit: 50 };

describe('ProveedoresListaComponent', () => {
  let fixture: ComponentFixture<ProveedoresListaComponent>;
  let component: ProveedoresListaComponent;
  let serviceSpy: jasmine.SpyObj<ProveedoresService>;
  let router: Router;

  beforeEach(async () => {
    serviceSpy = jasmine.createSpyObj('ProveedoresService', ['listar']);
    serviceSpy.listar.and.returnValue(of(listaVacia));

    await TestBed.configureTestingModule({
      imports: [ProveedoresListaComponent],
      providers: [
        provideRouter([]),
        { provide: ProveedoresService, useValue: serviceSpy },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(ProveedoresListaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('carga el listado con el filtro Estado=Activo por defecto', () => {
    expect(serviceSpy.listar).toHaveBeenCalledWith(
      jasmine.objectContaining({ estado: 'activo', page: 1, limit: 50 }),
    );
  });

  it('irAEditar() navega a la ruta de edición', () => {
    const navSpy = spyOn(router, 'navigate');
    component.irAEditar(1);
    expect(navSpy).toHaveBeenCalledWith(['/proveedores', 1, 'editar']);
  });

  it('clic en fila navega a editar', () => {
    serviceSpy.listar.and.returnValue(of(listaConProveedores));
    component.cargar();
    fixture.detectChanges();

    const navSpy = spyOn(router, 'navigate');
    const fila = fixture.nativeElement.querySelector('tbody tr');
    fila.click();
    expect(navSpy).toHaveBeenCalledWith(['/proveedores', proveedorActivo.id, 'editar']);
  });

  it('muestra el empty state cuando no hay proveedores', () => {
    expect(fixture.nativeElement.textContent).toContain('No hay proveedores registrados');
  });

  it('no muestra tabla cuando el listado está vacío', () => {
    expect(fixture.nativeElement.querySelector('table')).toBeNull();
  });

  it('muestra tabla con una fila por proveedor', () => {
    serviceSpy.listar.and.returnValue(of(listaConProveedores));
    component.cargar();
    fixture.detectChanges();

    const filas = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(filas.length).toBe(2);
  });

  it('muestra badge Activo/Inactivo según el estado del proveedor', () => {
    serviceSpy.listar.and.returnValue(of(listaConProveedores));
    component.cargar();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Activo');
    expect(fixture.nativeElement.textContent).toContain('Inactivo');
  });

  it('onBusqueda() actualiza el signal de búsqueda', () => {
    component.onBusqueda('cosecha');
    expect(component.busqueda()).toBe('cosecha');
  });

  it('onFilters() relanza cargar() con el nuevo estado y resetea la página', () => {
    component.pagina.set(3);
    serviceSpy.listar.calls.reset();
    serviceSpy.listar.and.returnValue(of(listaVacia));
    component.onFilters({ estado: 'inactivo' });

    expect(component.pagina()).toBe(1);
    expect(serviceSpy.listar).toHaveBeenCalledWith(
      jasmine.objectContaining({ estado: 'inactivo' }),
    );
  });

  it('muestra mensaje de error cuando el servicio falla', () => {
    serviceSpy.listar.and.returnValue(throwError(() => new Error('network error')));
    component.cargar();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Error al cargar');
  });
});
