import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';

import { CategoriasComponent } from './categorias.component';
import { CategoriasService } from './categorias.service';

function buildCat(id: number, nombre: string, activo = true) {
  return { id, nombre, activo, subcategorias: [], creado_por: 1, creado_en: '', actualizado_por: 1, actualizado_en: '' };
}

function buildSub(id: number, nombre: string, categoriaId: number, activo = true) {
  return { id, nombre, categoria_id: categoriaId, activo, total_items: 0, creado_por: 1, creado_en: '', actualizado_por: 1, actualizado_en: '' };
}

describe('CategoriasComponent', () => {
  let component: CategoriasComponent;
  let svc: jasmine.SpyObj<CategoriasService>;

  beforeEach(() => {
    svc = jasmine.createSpyObj<CategoriasService>('CategoriasService', [
      'obtenerCatalogo',
      'crearCategoria',
      'editarCategoria',
      'inactivarCategoria',
      'reactivarCategoria',
      'impactoCategoria',
      'crearSubcategoria',
      'editarSubcategoria',
      'inactivarSubcategoria',
      'reactivarSubcategoria',
    ]);
    svc.obtenerCatalogo.and.returnValue(of({ categorias: [], total: 0 }));

    TestBed.configureTestingModule({
      imports: [CategoriasComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: CategoriasService, useValue: svc },
      ],
    });

    const fixture = TestBed.createComponent(CategoriasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('carga el catálogo al inicializar', () => {
    expect(svc.obtenerCatalogo).toHaveBeenCalledTimes(1);
    expect(component.categorias()).toEqual([]);
  });

  it('crearCategoria — muestra error si nombre está vacío', () => {
    component.nuevaCatNombre.set('');
    component.crearCategoria();
    expect(component.errorCrearCat()).toBeTruthy();
    expect(svc.crearCategoria).not.toHaveBeenCalled();
  });

  it('crearCategoria — llama al servicio y recarga', fakeAsync(() => {
    svc.crearCategoria.and.returnValue(of(buildCat(1, 'Lácteo') as any));
    svc.obtenerCatalogo.and.returnValue(of({ categorias: [buildCat(1, 'Lácteo')], total: 1 }));
    component.nuevaCatNombre.set('Lácteo');
    component.crearCategoria();
    tick();
    expect(svc.crearCategoria).toHaveBeenCalledWith('Lácteo');
    expect(component.nuevaCatNombre()).toBe('');
  }));

  it('crearCategoria — muestra error 409 como nombre_duplicado', fakeAsync(() => {
    svc.crearCategoria.and.returnValue(throwError(() => ({ error: { error: 'nombre_duplicado' } })));
    component.nuevaCatNombre.set('Lácteo');
    component.crearCategoria();
    tick();
    expect(component.errorCrearCat()).toContain('Ya existe');
  }));

  it('activarEditCat — establece editandoCat e inicializa nombre', () => {
    const cat = buildCat(3, 'Bebidas');
    component.activarEditCat(cat);
    expect(component.editandoCat()).toBe(3);
    expect(component.editCatNombre()).toBe('Bebidas');
  });

  it('cancelarEditCat — limpia el estado de edición', () => {
    component.editandoCat.set(3);
    component.editCatNombre.set('X');
    component.cancelarEditCat();
    expect(component.editandoCat()).toBeNull();
    expect(component.editCatNombre()).toBe('');
  });

  it('inactivarSubcategoria — llama al servicio y recarga', fakeAsync(() => {
    svc.inactivarSubcategoria.and.returnValue(of(buildSub(7, 'Quesos', 1, false) as any));
    svc.obtenerCatalogo.and.returnValue(of({ categorias: [], total: 0 }));
    component.inactivarSubcategoria(7);
    tick();
    expect(svc.inactivarSubcategoria).toHaveBeenCalledWith(7);
  }));

  it('reactivarSubcategoria — muestra toast de error si categoría padre inactiva', fakeAsync(() => {
    svc.reactivarSubcategoria.and.returnValue(
      throwError(() => ({ error: { error: 'categoria_padre_inactiva' } })),
    );
    component.reactivarSubcategoria(7);
    tick();
    expect(component.toastMsg()).toContain('padre');
    expect(component.toastTipo()).toBe('rojo');
  }));

  it('solicitarInactivarCategoria — muestra modal con subcats activas', fakeAsync(() => {
    svc.impactoCategoria.and.returnValue(of({ subcategorias_activas: 3 }));
    component.solicitarInactivarCategoria(1);
    tick();
    expect(component.modalVisible()).toBeTrue();
    expect(component.modalSubcatsActivas()).toBe(3);
  }));

  it('cancelarModal — cierra el modal', () => {
    component.modalVisible.set(true);
    component.modalCategoriaId.set(1);
    component.cancelarModal();
    expect(component.modalVisible()).toBeFalse();
    expect(component.modalCategoriaId()).toBeNull();
  });
});
