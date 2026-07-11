import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

import { ProveedorDetalle, ProveedoresService } from '../proveedores.service';
import { FormModeService } from '../../shared/services/form-mode.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { FormCardComponent } from '../../shared/components/form-card/form-card.component';
import { DangerZoneComponent } from '../../shared/components/danger-zone/danger-zone.component';
import { ReadonlyFieldComponent } from '../../shared/components/readonly-field/readonly-field.component';

@Component({
  selector: 'app-proveedor-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    PageHeaderComponent,
    FormCardComponent,
    DangerZoneComponent,
    ReadonlyFieldComponent,
  ],
  providers: [FormModeService],
  templateUrl: './proveedor-form.component.html',
})
export class ProveedorFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly svc = inject(ProveedoresService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly formMode = inject(FormModeService);

  readonly modoEdicion = this.formMode.isEdit;
  readonly proveedorID = signal<number | null>(null);
  readonly guardando = signal(false);
  readonly toastMsg = signal('');
  readonly toastTipo = signal<'verde' | 'rojo'>('verde');
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  readonly proveedor = signal<ProveedorDetalle | null>(null);
  readonly mostrarModalCambioEstado = signal(false);
  readonly cambiandoEstado = signal(false);

  form!: FormGroup;

  ngOnInit(): void {
    this.form = this.fb.group({
      razon_social: ['', [Validators.required, Validators.maxLength(255)]],
      nit: ['', [Validators.required, Validators.maxLength(50)]],
      nombre_contacto: ['', Validators.maxLength(150)],
      telefono_contacto: ['', Validators.maxLength(50)],
      email_contacto: ['', [Validators.email, Validators.maxLength(255)]],
    });

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const id = Number(idParam);
      this.formMode.mode.set('edit');
      this.proveedorID.set(id);
      this.cargarProveedor(id);
    }
  }

  private cargarProveedor(id: number): void {
    this.svc.obtener(id).subscribe({
      next: (p) => {
        this.proveedor.set(p);
        this.form.patchValue({
          razon_social: p.razon_social,
          nit: p.nit,
          nombre_contacto: p.nombre_contacto ?? '',
          telefono_contacto: p.telefono_contacto ?? '',
          email_contacto: p.email_contacto ?? '',
        });
      },
      error: () => {
        this.mostrarToast('Error al cargar los datos del proveedor.', 'rojo', 5000);
      },
    });
  }

  solicitarCambioEstado(): void {
    this.mostrarModalCambioEstado.set(true);
  }

  cancelarCambioEstado(): void {
    this.mostrarModalCambioEstado.set(false);
  }

  confirmarCambioEstado(): void {
    const id = this.proveedorID()!;
    const activo = this.proveedor()?.activo ?? true;
    this.cambiandoEstado.set(true);
    const accion$ = activo ? this.svc.inactivar(id) : this.svc.activar(id);
    accion$.subscribe({
      next: () => {
        this.cambiandoEstado.set(false);
        this.mostrarModalCambioEstado.set(false);
        this.router.navigate(['/proveedores']);
      },
      error: (err) => {
        this.cambiandoEstado.set(false);
        this.mostrarModalCambioEstado.set(false);
        const msg = err?.error?.mensaje ?? 'Error al cambiar el estado del proveedor.';
        this.mostrarToast(msg, 'rojo', 5000);
      },
    });
  }

  enviar(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.guardando.set(true);
    const valores = this.form.getRawValue();
    const req = {
      razon_social: valores.razon_social,
      nit: valores.nit,
      nombre_contacto: valores.nombre_contacto || undefined,
      telefono_contacto: valores.telefono_contacto || undefined,
      email_contacto: valores.email_contacto || undefined,
    };

    if (this.modoEdicion()) {
      this.svc.editar(this.proveedorID()!, req).subscribe({
        next: () => {
          this.guardando.set(false);
          this.mostrarToast('Proveedor actualizado correctamente.', 'verde', 3000);
          setTimeout(() => this.router.navigate(['/proveedores']), 1500);
        },
        error: (err) => {
          this.guardando.set(false);
          this.handleApiError(err);
        },
      });
    } else {
      this.svc.crear(req).subscribe({
        next: () => {
          this.guardando.set(false);
          this.mostrarToast('Proveedor creado correctamente.', 'verde', 3000);
          setTimeout(() => this.router.navigate(['/proveedores']), 1500);
        },
        error: (err) => {
          this.guardando.set(false);
          this.handleApiError(err);
        },
      });
    }
  }

  private handleApiError(err: { status?: number; error?: { campo?: string; mensaje?: string } }): void {
    if ((err.status === 409 || err.status === 400) && err.error?.campo) {
      const control = this.form.get(err.error.campo);
      if (control) {
        control.setErrors({ apiError: err.error.mensaje });
        return;
      }
    }
    const msg = err.error?.mensaje ?? 'Error al guardar el proveedor.';
    this.mostrarToast(msg, 'rojo', 5000);
  }

  private mostrarToast(msg: string, tipo: 'verde' | 'rojo', ms: number): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastMsg.set(msg);
    this.toastTipo.set(tipo);
    this.toastTimer = setTimeout(() => this.toastMsg.set(''), ms);
  }

  errorDe(campo: string): string {
    const ctrl = this.form.get(campo);
    if (!ctrl?.touched || !ctrl.errors) return '';
    if (ctrl.errors['required']) return 'Este campo es obligatorio.';
    if (ctrl.errors['maxlength']) return `Máximo ${ctrl.errors['maxlength'].requiredLength} caracteres.`;
    if (ctrl.errors['email']) return 'El formato del email no es válido.';
    if (ctrl.errors['apiError']) return ctrl.errors['apiError'];
    return '';
  }
}
