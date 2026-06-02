import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
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

  beforeEach(async () => {
    serviceSpy = jasmine.createSpyObj('TiendasService', [
      'listar', 'inactivar', 'reactivar',
    ]);
    serviceSpy.listar.and.returnValue(of(listaVacia));

    await TestBed.configureTestingModule({
      imports: [TiendasListaComponent],
      providers: [
        provideRouter([]),
        { provide: TiendasService, useValue: serviceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TiendasListaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  // --- ngOnInit ---

  it('llama a listar() en ngOnInit con filtro "todas"', () => {
    expect(serviceSpy.listar).toHaveBeenCalledWith('todas', 1, 50);
  });

  // --- estado vacío ---

  it('muestra bloque de estado vacío cuando no hay tiendas', () => {
    expect(fixture.nativeElement.textContent).toContain('No hay tiendas registradas');
  });

  it('no muestra tabla cuando la lista está vacía', () => {
    const tabla = fixture.nativeElement.querySelector('table');
    expect(tabla).toBeNull();
  });

  // --- tabla con datos ---

  it('muestra tabla cuando hay tiendas', () => {
    serviceSpy.listar.and.returnValue(of(listaConTiendas));
    component.cargarTiendas();
    fixture.detectChanges();

    const tabla = fixture.nativeElement.querySelector('table');
    expect(tabla).toBeTruthy();
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

  it('cambiarFiltro() relanza listar() con el nuevo estado', () => {
    serviceSpy.listar.and.returnValue(of(listaVacia));
    component.cambiarFiltro('activas');

    expect(serviceSpy.listar).toHaveBeenCalledWith('activas', 1, 50);
  });

  it('cambiarFiltro() resetea pagina a 1', () => {
    component.pagina.set(3);
    serviceSpy.listar.and.returnValue(of(listaVacia));
    component.cambiarFiltro('inactivas');

    expect(component.pagina()).toBe(1);
  });

  it('actualiza Signal filtroEstado al cambiar filtro', () => {
    serviceSpy.listar.and.returnValue(of(listaVacia));
    component.cambiarFiltro('activas');
    expect(component.filtroEstado()).toBe('activas');
  });

  // --- error en carga ---

  it('muestra mensaje de error cuando el servicio falla', () => {
    serviceSpy.listar.and.returnValue(throwError(() => new Error('network error')));
    component.cargarTiendas();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Error al cargar');
  });

  // --- inactivar ---

  it('confirmarInactivar() llama al servicio y actualiza la lista', () => {
    serviceSpy.listar.and.returnValue(of({ ...listaConTiendas, datos: [tiendaActiva] }));
    component.cargarTiendas();
    fixture.detectChanges();

    const inactivada = { ...tiendaActiva, activo: false };
    serviceSpy.inactivar.and.returnValue(of(inactivada));

    component.confirmarInactivar(tiendaActiva);
    fixture.detectChanges();

    expect(serviceSpy.inactivar).toHaveBeenCalledWith(tiendaActiva.id);
    expect(component.tiendas()[0].activo).toBeFalse();
  });

  it('confirmarInactivar() muestra toast de error cuando el servicio falla', () => {
    serviceSpy.inactivar.and.returnValue(
      throwError(() => ({ status: 422, error: { mensaje: 'ya está inactiva' } })),
    );
    component.confirmarInactivar(tiendaActiva);
    fixture.detectChanges();

    expect(component.toastMsg()).toContain('ya está inactiva');
  });

  // --- reactivar ---

  it('confirmarReactivar() muestra confirm dialog y llama al servicio si acepta', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    serviceSpy.listar.and.returnValue(of({ ...listaConTiendas, datos: [tiendaInactiva] }));
    component.cargarTiendas();
    fixture.detectChanges();

    const reactivada = { ...tiendaInactiva, activo: true };
    serviceSpy.reactivar.and.returnValue(of(reactivada));

    component.confirmarReactivar(tiendaInactiva);
    fixture.detectChanges();

    expect(serviceSpy.reactivar).toHaveBeenCalledWith(tiendaInactiva.id);
    expect(component.tiendas()[0].activo).toBeTrue();
  });

  it('confirmarReactivar() NO llama al servicio si el usuario cancela el confirm', () => {
    spyOn(window, 'confirm').and.returnValue(false);
    component.confirmarReactivar(tiendaInactiva);
    expect(serviceSpy.reactivar).not.toHaveBeenCalled();
  });
});
