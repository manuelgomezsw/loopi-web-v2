import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { CategoriasComponent } from './categorias.component';
import { CategoriasService, Categoria } from './categorias.service';

function buildCat(id: number, nombre: string, activo = true): Categoria {
  return { id, nombre, activo, subcategorias: [], creado_por: 1, creado_en: '', actualizado_por: 1, actualizado_en: '' };
}

describe('CategoriasComponent', () => {
  let component: CategoriasComponent;
  let svc: jasmine.SpyObj<CategoriasService>;

  beforeEach(() => {
    svc = jasmine.createSpyObj<CategoriasService>('CategoriasService', ['obtenerCatalogo']);
    svc.obtenerCatalogo.and.returnValue(of({ categorias: [], total: 0 }));

    TestBed.configureTestingModule({
      imports: [CategoriasComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: CategoriasService, useValue: svc },
      ],
    });

    const fixture = TestBed.createComponent(CategoriasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('carga el catálogo al inicializar', () => {
    expect(svc.obtenerCatalogo).toHaveBeenCalled();
    expect(component.categorias()).toEqual([]);
  });

  it('popula categorias con la respuesta del servicio', fakeAsync(() => {
    const cats = [buildCat(1, 'Lácteo'), buildCat(2, 'Bebidas')];
    svc.obtenerCatalogo.and.returnValue(of({ categorias: cats, total: 2 }));
    component.cargar();
    tick();
    expect(component.categorias().length).toBe(2);
    expect(component.categorias()[0].nombre).toBe('Lácteo');
  }));

  it('establece errorMsg cuando el servicio falla', fakeAsync(() => {
    svc.obtenerCatalogo.and.returnValue(throwError(() => new Error('server error')));
    component.cargar();
    tick();
    expect(component.errorMsg()).toBeTruthy();
    expect(component.categorias().length).toBe(0);
  }));

  it('onFilters recarga el catálogo con el nuevo filtro', fakeAsync(() => {
    const cats = [buildCat(3, 'Snacks', false)];
    svc.obtenerCatalogo.and.returnValue(of({ categorias: cats, total: 1 }));
    svc.obtenerCatalogo.calls.reset();
    component.onFilters({ estado: 'inactivo' });
    tick();
    expect(svc.obtenerCatalogo).toHaveBeenCalledTimes(1);
    expect(component.categorias()[0].nombre).toBe('Snacks');
  }));

  it('limpia errorMsg al recargar', fakeAsync(() => {
    svc.obtenerCatalogo.and.returnValue(throwError(() => new Error()));
    component.cargar();
    tick();
    expect(component.errorMsg()).toBeTruthy();

    svc.obtenerCatalogo.and.returnValue(of({ categorias: [], total: 0 }));
    component.cargar();
    tick();
    expect(component.errorMsg()).toBe('');
  }));
});
