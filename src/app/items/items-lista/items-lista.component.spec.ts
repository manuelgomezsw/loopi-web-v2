import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { ItemsListaComponent } from './items-lista.component';
import { Item, ItemsService, ListarItemsResponse } from '../items.service';
import { AuthService } from '../../auth/auth.service';

const itemActivo: Item = {
  id: 1,
  codigo: 'LEC-001',
  nombre: 'Leche Entera',
  tipo: 'insumo',
  subcategoria_id: 3,
  subcategoria_nombre: 'Lácteos > Líquidos',
  proveedor_id: 2,
  proveedor_nombre: 'Distribuidora Norte',
  unidad_medida_id: 5,
  unidad_medida_simbolo: 'ml',
  costo_unitario: 3200,
  frecuencia_inventario: 'diario',
  stock_seguridad: '10000.0000',
  tiempo_entrega_dias: 2,
  activo: true,
  creado_por: 1,
  creado_en: '2026-05-24T10:00:00',
  actualizado_por: 1,
  actualizado_en: '2026-05-24T10:00:00',
};

const itemInactivo: Item = { ...itemActivo, id: 2, nombre: 'Item viejo', activo: false };

const listaConItems: ListarItemsResponse = { items: [itemActivo, itemInactivo], total: 2, pagina: 1, total_paginas: 1 };
const listaVacia: ListarItemsResponse = { items: [], total: 0, pagina: 1, total_paginas: 0 };

describe('ItemsListaComponent', () => {
  let fixture: ComponentFixture<ItemsListaComponent>;
  let component: ItemsListaComponent;
  let serviceSpy: jasmine.SpyObj<ItemsService>;
  let router: Router;

  function setup(rol: string) {
    TestBed.resetTestingModule();
    serviceSpy = jasmine.createSpyObj('ItemsService', ['listarItems', 'inactivarItem', 'reactivarItem']);
    serviceSpy.listarItems.and.returnValue(of(listaVacia));

    TestBed.configureTestingModule({
      imports: [ItemsListaComponent],
      providers: [
        provideRouter([]),
        { provide: ItemsService, useValue: serviceSpy },
        { provide: AuthService, useValue: { sesion: () => ({ rol, tienda_id: null }) } },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(ItemsListaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => setup('admin'));

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('carga el listado con el filtro Estado=Activo por defecto', () => {
    expect(serviceSpy.listarItems).toHaveBeenCalledWith(
      jasmine.objectContaining({ activo: true, pagina: 1, por_pagina: 50 }),
    );
  });

  it('muestra el empty state cuando no hay items', () => {
    expect(fixture.nativeElement.textContent).toContain('Aún no hay items registrados');
  });

  it('no muestra tabla cuando el listado está vacío', () => {
    expect(fixture.nativeElement.querySelector('table')).toBeNull();
  });

  it('onFilters() con tipo=insumo relanza cargar() y resetea la página', () => {
    component.pagina.set(3);
    serviceSpy.listarItems.calls.reset();
    serviceSpy.listarItems.and.returnValue(of(listaVacia));
    component.onFilters({ tipo: 'insumo', frecuencia: 'todos', estado: 'activo' });

    expect(component.pagina()).toBe(1);
    expect(serviceSpy.listarItems).toHaveBeenCalledWith(
      jasmine.objectContaining({ tipo: 'insumo' }),
    );
  });

  it('onPage() actualiza la página y recarga', () => {
    serviceSpy.listarItems.calls.reset();
    serviceSpy.listarItems.and.returnValue(of(listaConItems));
    component.onPage(2);

    expect(component.pagina()).toBe(2);
    expect(serviceSpy.listarItems).toHaveBeenCalledWith(
      jasmine.objectContaining({ pagina: 2 }),
    );
  });

  it('irADetalle() navega a /items/:id', () => {
    const navSpy = spyOn(router, 'navigate');
    component.irADetalle(1);
    expect(navSpy).toHaveBeenCalledWith(['/items', 1]);
  });

  it('muestra tabla con una fila por item', () => {
    serviceSpy.listarItems.and.returnValue(of(listaConItems));
    component.cargar();
    fixture.detectChanges();

    const filas = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(filas.length).toBe(2);
  });

  it('muestra mensaje de error cuando el servicio falla', () => {
    serviceSpy.listarItems.and.returnValue(throwError(() => new Error('network error')));
    component.cargar();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Error al cargar');
  });

  describe('botón inactivar con modal (rol admin)', () => {
    beforeEach(() => {
      serviceSpy.listarItems.and.returnValue(of(listaConItems));
      component.cargar();
      fixture.detectChanges();
    });

    it('abre el modal de confirmación al solicitar el cambio de estado', () => {
      component.solicitarCambioEstado(itemActivo, new Event('click'));
      expect(component.mostrarModalCambioEstado()).toBeTrue();
      expect(component.itemSeleccionado()).toEqual(itemActivo);
    });

    it('confirmarCambioEstado() llama a inactivarItem() para un item activo y recarga', () => {
      serviceSpy.inactivarItem.and.returnValue(of({ id: 1, codigo: 'LEC-001', nombre: 'Leche Entera', activo: false, actualizado_por: 1, actualizado_en: '2026-05-24T12:00:00' }));
      component.solicitarCambioEstado(itemActivo, new Event('click'));
      component.confirmarCambioEstado();

      expect(serviceSpy.inactivarItem).toHaveBeenCalledWith(1);
      expect(component.mostrarModalCambioEstado()).toBeFalse();
    });

    it('confirmarCambioEstado() llama a reactivarItem() para un item inactivo', () => {
      serviceSpy.reactivarItem.and.returnValue(of({ id: 2, codigo: 'LEC-001', nombre: 'Item viejo', activo: true, actualizado_por: 1, actualizado_en: '2026-05-24T12:00:00' }));
      component.solicitarCambioEstado(itemInactivo, new Event('click'));
      component.confirmarCambioEstado();

      expect(serviceSpy.reactivarItem).toHaveBeenCalledWith(2);
    });

    it('cancelarCambioEstado() cierra el modal sin llamar al servicio', () => {
      component.solicitarCambioEstado(itemActivo, new Event('click'));
      component.cancelarCambioEstado();

      expect(component.mostrarModalCambioEstado()).toBeFalse();
      expect(serviceSpy.inactivarItem).not.toHaveBeenCalled();
    });
  });

  describe('rol no admin', () => {
    beforeEach(() => setup('barista'));

    it('no muestra el botón de inactivar/reactivar', () => {
      serviceSpy.listarItems.and.returnValue(of(listaConItems));
      component.cargar();
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).not.toContain('Inactivar');
    });
  });
});
