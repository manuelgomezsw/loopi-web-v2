import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';

import { ProveedorFormComponent } from './proveedor-form.component';
import { ProveedoresService, ProveedorDetalle } from '../proveedores.service';

const proveedorEjemplo: ProveedorDetalle = {
  id: 1,
  razon_social: 'Distribuidora La Cosecha S.A.S',
  nit: '900123456-7',
  nombre_contacto: 'Carlos Rodríguez',
  telefono_contacto: '3001234567',
  email_contacto: 'carlos@lacosecha.com',
  activo: true,
  creado_en: '2026-05-24T10:00:00',
  actualizado_en: '2026-05-24T10:00:00',
  items_asignados: 3,
};

function mockRoute(id: string | null) {
  return {
    snapshot: {
      paramMap: { get: () => id },
    },
  };
}

async function setupComponent(idParam: string | null) {
  const serviceSpy = jasmine.createSpyObj<ProveedoresService>('ProveedoresService', [
    'crear', 'obtener', 'editar', 'inactivar', 'activar',
  ]);

  if (idParam) {
    serviceSpy.obtener.and.returnValue(of(proveedorEjemplo));
  }

  await TestBed.configureTestingModule({
    imports: [ProveedorFormComponent],
    providers: [
      provideRouter([]),
      { provide: ProveedoresService, useValue: serviceSpy },
      { provide: ActivatedRoute, useValue: mockRoute(idParam) },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(ProveedorFormComponent);
  const component = fixture.componentInstance;
  fixture.detectChanges();

  return { fixture, component, serviceSpy };
}

// ============================================================
// Modo creación
// ============================================================

describe('ProveedorFormComponent — modo creación', () => {
  let fixture: ComponentFixture<ProveedorFormComponent>;
  let component: ProveedorFormComponent;
  let serviceSpy: jasmine.SpyObj<ProveedoresService>;

  beforeEach(async () => {
    ({ fixture, component, serviceSpy } = await setupComponent(null));
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('muestra título "Nuevo proveedor"', () => {
    expect(fixture.nativeElement.textContent).toContain('Nuevo proveedor');
  });

  it('modoEdicion es false en creación', () => {
    expect(component.modoEdicion()).toBeFalse();
  });

  it('el formulario es inválido cuando razon_social y nit están vacíos', () => {
    expect(component.form.invalid).toBeTrue();
  });

  it('el formulario sigue siendo inválido si falta nombre_contacto o telefono_contacto', () => {
    component.form.patchValue({ razon_social: 'Proveedor X', nit: 'PROV-001' });
    expect(component.form.invalid).toBeTrue();
  });

  it('el formulario es válido con razon_social, nit, nombre_contacto y telefono_contacto completos', () => {
    component.form.patchValue({
      razon_social: 'Proveedor X', nit: 'PROV-001',
      nombre_contacto: 'Juan Pérez', telefono_contacto: '3009998877',
    });
    expect(component.form.valid).toBeTrue();
  });

  it('no muestra la Zona de precaución en modo creación', () => {
    expect(fixture.nativeElement.textContent).not.toContain('Zona de precaución');
  });

  it('enviar() no llama al servicio si el formulario es inválido', () => {
    component.enviar();
    expect(serviceSpy.crear).not.toHaveBeenCalled();
  });

  it('enviar() llama a crear() con el payload correcto', () => {
    serviceSpy.crear.and.returnValue(of({ ...proveedorEjemplo }));
    component.form.patchValue({
      razon_social: 'Proveedor X', nit: 'PROV-001',
      nombre_contacto: 'Juan Pérez', telefono_contacto: '3009998877',
    });
    component.enviar();

    expect(serviceSpy.crear).toHaveBeenCalledWith(
      jasmine.objectContaining({
        razon_social: 'Proveedor X', nit: 'PROV-001',
        nombre_contacto: 'Juan Pérez', telefono_contacto: '3009998877',
      }),
    );
  });

  it('enviar() mapea error 409 con campo "nit" al control correspondiente', () => {
    serviceSpy.crear.and.returnValue(
      throwError(() => ({ status: 409, error: { error: 'nit_duplicado', mensaje: 'Ya existe.', campo: 'nit' } })),
    );
    component.form.patchValue({
      razon_social: 'Proveedor X', nit: 'PROV-001',
      nombre_contacto: 'Juan Pérez', telefono_contacto: '3009998877',
    });
    component.enviar();

    expect(component.form.get('nit')?.errors?.['apiError']).toBe('Ya existe.');
  });
});

// ============================================================
// Modo edición
// ============================================================

describe('ProveedorFormComponent — modo edición', () => {
  let fixture: ComponentFixture<ProveedorFormComponent>;
  let component: ProveedorFormComponent;
  let serviceSpy: jasmine.SpyObj<ProveedoresService>;

  beforeEach(async () => {
    ({ fixture, component, serviceSpy } = await setupComponent('1'));
  });

  it('muestra título "Editar proveedor"', () => {
    expect(fixture.nativeElement.textContent).toContain('Editar proveedor');
  });

  it('modoEdicion es true en edición', () => {
    expect(component.modoEdicion()).toBeTrue();
  });

  it('carga los datos del proveedor con obtener()', () => {
    expect(serviceSpy.obtener).toHaveBeenCalledWith(1);
    expect(component.form.get('razon_social')?.value).toBe('Distribuidora La Cosecha S.A.S');
    expect(component.form.get('nit')?.value).toBe('900123456-7');
  });

  it('muestra items_asignados como campo de solo lectura', () => {
    expect(fixture.nativeElement.textContent).toContain('Items asignados');
    expect(fixture.nativeElement.textContent).toContain('3');
  });

  it('muestra la Zona de precaución con botón "Inactivar proveedor" cuando el proveedor está activo', () => {
    expect(fixture.nativeElement.textContent).toContain('Inactivar proveedor');
  });

  it('confirmarCambioEstado() llama a inactivar() cuando el proveedor está activo', () => {
    serviceSpy.inactivar.and.returnValue(of({ id: 1, activo: false, mensaje: 'ok' }));
    component.solicitarCambioEstado();
    component.confirmarCambioEstado();
    expect(serviceSpy.inactivar).toHaveBeenCalledWith(1);
  });

  it('enviar() en modo edición llama a editar() con el id correcto', () => {
    serviceSpy.editar.and.returnValue(of(proveedorEjemplo));
    component.form.patchValue({ nombre_contacto: 'María López' });
    component.enviar();

    expect(serviceSpy.editar).toHaveBeenCalledWith(
      1,
      jasmine.objectContaining({ nombre_contacto: 'María López' }),
    );
  });
});

describe('ProveedorFormComponent — proveedor inactivo', () => {
  it('muestra botón "Reactivar proveedor" y llama a activar() al confirmar', async () => {
    const serviceSpy = jasmine.createSpyObj<ProveedoresService>('ProveedoresService', [
      'crear', 'obtener', 'editar', 'inactivar', 'activar',
    ]);
    serviceSpy.obtener.and.returnValue(of({ ...proveedorEjemplo, activo: false }));
    serviceSpy.activar.and.returnValue(of({ id: 1, activo: true, mensaje: 'ok' }));

    await TestBed.configureTestingModule({
      imports: [ProveedorFormComponent],
      providers: [
        provideRouter([]),
        { provide: ProveedoresService, useValue: serviceSpy },
        { provide: ActivatedRoute, useValue: mockRoute('1') },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ProveedorFormComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Reactivar proveedor');
    component.solicitarCambioEstado();
    component.confirmarCambioEstado();
    expect(serviceSpy.activar).toHaveBeenCalledWith(1);
  });
});
