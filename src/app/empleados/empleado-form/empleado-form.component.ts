import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import {
  CrearEmpleadoRequest,
  EditarEmpleadoRequest,
  Empleado,
  EmpleadosService,
} from '../empleados.service';
import { TiendasService } from '../../tiendas/tiendas.service';

function mayorDeEdad(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    const partes = (control.value as string).split('-').map(Number);
    const fecha = new Date(partes[0], partes[1] - 1, partes[2]);
    const hoy = new Date();
    const limite = new Date(hoy.getFullYear() - 18, hoy.getMonth(), hoy.getDate());
    return fecha <= limite ? null : { menorDeEdad: true };
  };
}

const TIPOS_DOCUMENTO = [
  { codigo: 'CC', etiqueta: 'Cédula de Ciudadanía (CC)' },
  { codigo: 'CE', etiqueta: 'Cédula de Extranjería (CE)' },
  { codigo: 'NUIP', etiqueta: 'NUIP' },
  { codigo: 'PE', etiqueta: 'Permiso Especial de Permanencia (PE)' },
];

@Component({
  selector: 'app-empleado-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './empleado-form.component.html',
})
export class EmpleadoFormComponent implements OnInit {
  private readonly svc = inject(EmpleadosService);
  private readonly tiendasSvc = inject(TiendasService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly tiposDocumento = TIPOS_DOCUMENTO;
  readonly tiendasActivas = signal<{ id: number; nombre: string }[]>([]);
  readonly cargandoTiendas = signal<boolean>(false);
  readonly errorCargaTiendas = signal<string>('');

  readonly modoEdicion = signal<boolean>(false);
  readonly empleadoID = signal<number | null>(null);
  readonly cargando = signal<boolean>(false);
  readonly guardando = signal<boolean>(false);
  readonly errorApi = signal<string>('');

  // Modal contraseña temporal (crear + reset)
  readonly mostrarModalContrasena = signal<boolean>(false);
  readonly contrasenaTemporal = signal<string>('');
  readonly copiaConfirmada = signal<boolean>(false);

  // Modal confirmación inactivar/reactivar
  readonly mostrarModalEstado = signal<boolean>(false);
  readonly nuevoEstado = signal<boolean>(true);

  // Modal confirmación resetear contraseña
  readonly mostrarModalResetContrasena = signal<boolean>(false);

  readonly empleado = signal<Empleado | null>(null);

  readonly form = this.fb.group({
    nombre: ['', Validators.required],
    apellido: ['', Validators.required],
    usuario: [{ value: '', disabled: false }, Validators.required],
    rol: ['barista', Validators.required],
    tienda_id: [null as number | null],
    tipo_documento: [''],
    numero_documento: [''],
    telefono: [''],
    email: ['', Validators.email],
    fecha_nacimiento: ['', mayorDeEdad()],
  });

  get rolActual(): string {
    return this.form.get('rol')?.value ?? '';
  }

  get requiereTienda(): boolean {
    return this.rolActual === 'lider_tienda' || this.rolActual === 'barista';
  }

  ngOnInit(): void {
    this.cargarTiendasActivas();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.modoEdicion.set(true);
      this.empleadoID.set(+id);
      this.cargarEmpleado(+id);
    }
  }

  private cargarTiendasActivas(): void {
    this.cargandoTiendas.set(true);
    this.errorCargaTiendas.set('');
    this.tiendasSvc.getTiendasActivas().subscribe({
      next: (tiendas) => {
        this.tiendasActivas.set(tiendas);
        this.cargandoTiendas.set(false);
      },
      error: () => {
        this.errorCargaTiendas.set('No se pudieron cargar las tiendas activas.');
        this.cargandoTiendas.set(false);
      },
    });
  }

  cargarEmpleado(id: number): void {
    this.cargando.set(true);
    this.svc.obtener(id).subscribe({
      next: (emp) => {
        this.empleado.set(emp);
        this.form.patchValue({
          nombre: emp.nombre,
          apellido: emp.apellido,
          usuario: emp.usuario,
          rol: emp.rol,
          tienda_id: emp.tienda_id,
          tipo_documento: emp.tipo_documento ?? '',
          numero_documento: emp.numero_documento ?? '',
          telefono: emp.telefono ?? '',
          email: emp.email ?? '',
          fecha_nacimiento: emp.fecha_nacimiento ?? '',
        });
        this.form.get('usuario')?.disable();
        this.cargando.set(false);
      },
      error: () => {
        this.errorApi.set('Error al cargar el empleado.');
        this.cargando.set(false);
      },
    });
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.guardando()) return;
    this.guardando.set(true);
    this.errorApi.set('');

    if (this.modoEdicion()) {
      this.guardarEdicion();
    } else {
      this.guardarCreacion();
    }
  }

  private guardarCreacion(): void {
    const v = this.form.getRawValue();
    const req: CrearEmpleadoRequest = {
      nombre: v.nombre!,
      apellido: v.apellido!,
      usuario: v.usuario!,
      rol: v.rol!,
    };
    if (this.requiereTienda && v.tienda_id) req.tienda_id = v.tienda_id;
    if (v.tipo_documento) req.tipo_documento = v.tipo_documento;
    if (v.numero_documento) req.numero_documento = v.numero_documento;
    if (v.telefono) req.telefono = v.telefono;
    if (v.email) req.email = v.email;
    if (v.fecha_nacimiento) req.fecha_nacimiento = v.fecha_nacimiento;

    this.svc.crear(req).subscribe({
      next: (resp) => {
        this.guardando.set(false);
        this.contrasenaTemporal.set(resp.contrasena_temporal);
        this.mostrarModalContrasena.set(true);
      },
      error: (err) => {
        this.guardando.set(false);
        this.errorApi.set(err?.error?.mensaje ?? 'Error al crear el empleado.');
        if (err?.error?.campo) {
          this.form.get(err.error.campo)?.setErrors({ servidor: err.error.mensaje });
        }
      },
    });
  }

  private guardarEdicion(): void {
    const v = this.form.getRawValue();
    const req: EditarEmpleadoRequest = {
      nombre: v.nombre ?? undefined,
      apellido: v.apellido ?? undefined,
      rol: v.rol ?? undefined,
    };
    if (v.tienda_id) req.tienda_id = v.tienda_id;
    if (v.tipo_documento) req.tipo_documento = v.tipo_documento;
    if (v.numero_documento) req.numero_documento = v.numero_documento;
    if (v.telefono) req.telefono = v.telefono;
    if (v.email) req.email = v.email;
    if (v.fecha_nacimiento) req.fecha_nacimiento = v.fecha_nacimiento;

    this.svc.editar(this.empleadoID()!, req).subscribe({
      next: () => {
        this.guardando.set(false);
        this.router.navigate(['/empleados']);
      },
      error: (err) => {
        this.guardando.set(false);
        this.errorApi.set(err?.error?.mensaje ?? 'Error al guardar los cambios.');
        if (err?.error?.campo) {
          this.form.get(err.error.campo)?.setErrors({ servidor: err.error.mensaje });
        }
      },
    });
  }

  confirmarCambioEstado(activo: boolean): void {
    this.nuevoEstado.set(activo);
    this.mostrarModalEstado.set(true);
  }

  ejecutarCambioEstado(): void {
    this.mostrarModalEstado.set(false);
    const id = this.empleadoID()!;
    const activo = this.nuevoEstado();
    this.svc.cambiarEstado(id, activo).subscribe({
      next: () => {
        this.router.navigate(['/empleados']);
      },
      error: (err) => {
        if (err?.error?.error === 'ultimo_admin_activo') {
          this.errorApi.set('No es posible inactivar al último administrador activo.');
        } else {
          this.errorApi.set(err?.error?.mensaje ?? 'Error al cambiar el estado del empleado.');
        }
      },
    });
  }

  cancelarCambioEstado(): void {
    this.mostrarModalEstado.set(false);
  }

  resetearContrasena(): void {
    this.mostrarModalResetContrasena.set(true);
  }

  confirmarResetContrasena(): void {
    this.mostrarModalResetContrasena.set(false);
    this.svc.resetearContrasena(this.empleadoID()!).subscribe({
      next: (resp) => {
        this.contrasenaTemporal.set(resp.contrasena_temporal);
        this.copiaConfirmada.set(false);
        this.mostrarModalContrasena.set(true);
      },
      error: (err) => {
        this.errorApi.set(err?.error?.mensaje ?? 'Error al resetear la contraseña.');
      },
    });
  }

  cancelarResetContrasena(): void {
    this.mostrarModalResetContrasena.set(false);
  }

  cerrarModalContrasena(): void {
    if (!this.copiaConfirmada()) return;
    this.mostrarModalContrasena.set(false);
    if (!this.modoEdicion()) {
      this.router.navigate(['/empleados']);
    }
  }

  confirmarCopia(): void {
    this.copiaConfirmada.set(true);
  }

  get fechaMaxNacimiento(): string {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 18);
    return d.toISOString().split('T')[0];
  }

  campoInvalido(campo: string): boolean {
    const c = this.form.get(campo);
    return !!(c?.invalid && (c.touched || c.dirty));
  }
}
