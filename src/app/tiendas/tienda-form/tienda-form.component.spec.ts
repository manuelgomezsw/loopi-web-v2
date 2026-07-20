import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

import { TiendaFormComponent } from './tienda-form.component';
import { TiendasService, TiendaResponse } from '../tiendas.service';

const tiendaEjemplo: TiendaResponse = {
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

/** Crea un ActivatedRoute mock para el modo indicado. */
function mockRoute(id: string | null) {
  return {
    snapshot: {
      paramMap: { get: () => id },
    },
  };
}

async function setupComponent(idParam: string | null) {
  const serviceSpy = jasmine.createSpyObj<TiendasService>('TiendasService', [
    'crear', 'obtener', 'actualizar',
  ]);

  if (idParam) {
    serviceSpy.obtener.and.returnValue(of(tiendaEjemplo));
  }

  await TestBed.configureTestingModule({
    imports: [TiendaFormComponent],
    providers: [
      provideRouter([]),
      { provide: TiendasService, useValue: serviceSpy },
      { provide: ActivatedRoute, useValue: mockRoute(idParam) },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(TiendaFormComponent);
  const component = fixture.componentInstance;
  fixture.detectChanges();

  return { fixture, component, serviceSpy };
}

// ============================================================
// Modo creación
// ============================================================

describe('TiendaFormComponent — modo creación', () => {
  let fixture: ComponentFixture<TiendaFormComponent>;
  let component: TiendaFormComponent;
  let serviceSpy: jasmine.SpyObj<TiendasService>;

  beforeEach(async () => {
    ({ fixture, component, serviceSpy } = await setupComponent(null));
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('muestra título "Nueva tienda"', () => {
    expect(fixture.nativeElement.textContent).toContain('Nueva tienda');
  });

  it('modoEdicion es false en creación', () => {
    expect(component.modoEdicion()).toBeFalse();
  });

  it('el formulario es inválido cuando todos los campos están vacíos', () => {
    expect(component.form.invalid).toBeTrue();
  });

  it('el botón Guardar está habilitado aunque el formulario sea inválido (la guardia está en enviar())', () => {
    component.form.markAllAsTouched();
    fixture.detectChanges();
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('button[type="submit"]');
    expect(btn.disabled).toBeFalse();
  });

  it('el botón Guardar se habilita con formulario válido', () => {
    component.form.setValue({
      codigo: 'TDA-001', nombre: 'Norte', direccion: 'Calle 1',
      ciudad: 'Bogotá', telefono: '300',
    });
    fixture.detectChanges();
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('button[type="submit"]');
    expect(btn.disabled).toBeFalse();
  });

  it('enviar() no llama al servicio si el formulario es inválido', () => {
    component.enviar();
    expect(serviceSpy.crear).not.toHaveBeenCalled();
  });

  it('enviar() llama a crear() con el body correcto', () => {
    serviceSpy.crear.and.returnValue(of(tiendaEjemplo));
    component.form.setValue({
      codigo: 'TDA-001', nombre: 'Norte', direccion: 'Calle 1',
      ciudad: 'Bogotá', telefono: '300',
    });

    component.enviar();

    expect(serviceSpy.crear).toHaveBeenCalledWith({
      codigo: 'TDA-001', nombre: 'Norte', direccion: 'Calle 1',
      ciudad: 'Bogotá', telefono: '300',
    });
  });

  it('muestra toast verde tras crear exitosamente', () => {
    // of() es síncrono: el callback next() se ejecuta dentro de enviar()
    // antes de que cualquier setTimeout pueda dispararse.
    serviceSpy.crear.and.returnValue(of(tiendaEjemplo));
    component.form.setValue({
      codigo: 'X', nombre: 'N', direccion: 'D', ciudad: 'C', telefono: 'T',
    });

    component.enviar();
    fixture.detectChanges();

    expect(component.toastMsg()).toContain('correctamente');
    expect(component.toastTipo()).toBe('verde');
  });

  it('en error 409 nombre_duplicado muestra el error en el campo nombre', () => {
    const errorResp = new HttpErrorResponse({
      status: 409,
      error: { campo: 'nombre', mensaje: 'Ya existe una tienda con ese nombre.' },
    });
    serviceSpy.crear.and.returnValue(throwError(() => errorResp));
    component.form.setValue({
      codigo: 'X', nombre: 'Duplicado', direccion: 'D', ciudad: 'C', telefono: 'T',
    });

    component.enviar();
    fixture.detectChanges();

    const errorNombre = component.errorDe('nombre');
    expect(errorNombre).toContain('Ya existe una tienda con ese nombre.');
  });

  it('en error 4xx sin campo muestra toast rojo', () => {
    const errorResp = new HttpErrorResponse({
      status: 500,
      error: { mensaje: 'Error interno del servidor.' },
    });
    serviceSpy.crear.and.returnValue(throwError(() => errorResp));
    component.form.setValue({
      codigo: 'X', nombre: 'N', direccion: 'D', ciudad: 'C', telefono: 'T',
    });

    component.enviar();
    fixture.detectChanges();

    expect(component.toastTipo()).toBe('rojo');
  });

  it('el botón muestra "Guardando..." durante el envío en vuelo', () => {
    component.guardando.set(true);
    fixture.detectChanges();
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('button[type="submit"]');
    expect(btn.textContent?.trim()).toContain('Guardando');
    expect(btn.disabled).toBeTrue();
  });

  it('errorDe() retorna vacío cuando el campo no ha sido tocado', () => {
    expect(component.errorDe('nombre')).toBe('');
  });

  it('errorDe() retorna mensaje cuando el campo es requerido y fue tocado', () => {
    component.form.get('nombre')?.markAsTouched();
    fixture.detectChanges();
    expect(component.errorDe('nombre')).toContain('obligatorio');
  });
});

// ============================================================
// Modo edición
// ============================================================

describe('TiendaFormComponent — modo edición', () => {
  let fixture: ComponentFixture<TiendaFormComponent>;
  let component: TiendaFormComponent;
  let serviceSpy: jasmine.SpyObj<TiendasService>;

  beforeEach(async () => {
    ({ fixture, component, serviceSpy } = await setupComponent('1'));
  });

  it('modoEdicion es true cuando hay id en la ruta', () => {
    expect(component.modoEdicion()).toBeTrue();
  });

  it('muestra título "Editar tienda"', () => {
    expect(fixture.nativeElement.textContent).toContain('Editar tienda');
  });

  it('llama a obtener() para cargar los datos iniciales', () => {
    expect(serviceSpy.obtener).toHaveBeenCalledWith(1);
  });

  it('precarga los valores del formulario con los datos de la tienda', () => {
    expect(component.form.get('nombre')?.value).toBe('Tienda Norte');
    expect(component.form.get('ciudad')?.value).toBe('Bogotá');
  });

  it('el campo codigo está deshabilitado en modo edición', () => {
    expect(component.form.get('codigo')?.disabled).toBeTrue();
  });

  it('enviar() llama a actualizar() con el body correcto', () => {
    serviceSpy.actualizar.and.returnValue(of(tiendaEjemplo));
    component.form.patchValue({ nombre: 'Nuevo nombre' });

    component.enviar();

    expect(serviceSpy.actualizar).toHaveBeenCalledWith(
      1,
      jasmine.objectContaining({ nombre: 'Nuevo nombre' }),
    );
  });

  it('el body de actualizar() nunca incluye codigo', () => {
    serviceSpy.actualizar.and.returnValue(of(tiendaEjemplo));
    component.enviar();

    const body = serviceSpy.actualizar.calls.mostRecent().args[1];
    expect((body as unknown as Record<string, unknown>)['codigo']).toBeUndefined();
  });
});
