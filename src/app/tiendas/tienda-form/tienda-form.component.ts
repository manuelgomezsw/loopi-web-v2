import { Component, inject, OnInit, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

import {
  TiendaResponse,
  TiendasService,
  TiendaUpdateRequest,
} from '../tiendas.service';

@Component({
  selector: 'app-tienda-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './tienda-form.component.html',
})
export class TiendaFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly tiendasService = inject(TiendasService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly modoEdicion = signal<boolean>(false);
  readonly tiendaID = signal<number | null>(null);
  readonly tiendaActiva = signal<boolean>(true);
  readonly guardando = signal<boolean>(false);
  readonly cambiandoEstado = signal<boolean>(false);
  readonly mostrarModalEstado = signal<boolean>(false);
  readonly toastMsg = signal<string>('');
  readonly toastTipo = signal<'verde' | 'rojo'>('verde');
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  form!: FormGroup;

  ngOnInit(): void {
    this.form = this.fb.group({
      codigo: ['', [Validators.required, Validators.maxLength(20)]],
      nombre: ['', [Validators.required, Validators.maxLength(150)]],
      direccion: ['', [Validators.required, Validators.maxLength(255)]],
      ciudad: ['', [Validators.required, Validators.maxLength(100)]],
      telefono: ['', [Validators.required, Validators.maxLength(20)]],
    });

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const id = Number(idParam);
      this.modoEdicion.set(true);
      this.tiendaID.set(id);
      this.form.get('codigo')?.disable();
      this.cargarTienda(id);
    }
  }

  private cargarTienda(id: number): void {
    this.tiendasService.obtener(id).subscribe({
      next: (tienda: TiendaResponse) => {
        this.tiendaActiva.set(tienda.activo);
        this.form.patchValue({
          codigo: tienda.codigo,
          nombre: tienda.nombre,
          direccion: tienda.direccion,
          ciudad: tienda.ciudad,
          telefono: tienda.telefono,
        });
      },
      error: () => {
        this.mostrarToast('Error al cargar los datos de la tienda.', 'rojo', 5000);
      },
    });
  }

  enviar(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }

    this.guardando.set(true);

    if (this.modoEdicion()) {
      const req: TiendaUpdateRequest = {
        nombre: this.form.value.nombre,
        direccion: this.form.value.direccion,
        ciudad: this.form.value.ciudad,
        telefono: this.form.value.telefono,
      };
      this.tiendasService.actualizar(this.tiendaID()!, req).subscribe({
        next: () => {
          this.guardando.set(false);
          this.mostrarToast('Tienda actualizada correctamente.', 'verde', 3000);
          setTimeout(() => this.router.navigate(['/tiendas']), 1500);
        },
        error: (err) => {
          this.guardando.set(false);
          this.handleApiError(err);
        },
      });
    } else {
      this.tiendasService.crear(this.form.value).subscribe({
        next: () => {
          this.guardando.set(false);
          this.mostrarToast('Tienda creada correctamente.', 'verde', 3000);
          setTimeout(() => this.router.navigate(['/tiendas']), 1500);
        },
        error: (err) => {
          this.guardando.set(false);
          this.handleApiError(err);
        },
      });
    }
  }

  solicitarCambioEstado(): void {
    this.mostrarModalEstado.set(true);
  }

  cancelarCambioEstado(): void {
    this.mostrarModalEstado.set(false);
  }

  ejecutarCambioEstado(): void {
    const id = this.tiendaID()!;
    const accion = this.tiendaActiva()
      ? this.tiendasService.inactivar(id)
      : this.tiendasService.reactivar(id);

    this.cambiandoEstado.set(true);
    this.mostrarModalEstado.set(false);

    accion.subscribe({
      next: (tienda: TiendaResponse) => {
        this.tiendaActiva.set(tienda.activo);
        this.cambiandoEstado.set(false);
        const msg = tienda.activo
          ? 'Tienda reactivada correctamente.'
          : 'Tienda inactivada correctamente.';
        this.mostrarToast(msg, 'verde', 3000);
        setTimeout(() => this.router.navigate(['/tiendas']), 1500);
      },
      error: (err) => {
        this.cambiandoEstado.set(false);
        const msg = err?.error?.mensaje ?? 'Error al cambiar el estado de la tienda.';
        this.mostrarToast(msg, 'rojo', 5000);
      },
    });
  }

  private handleApiError(err: { status?: number; error?: { campo?: string; mensaje?: string } }): void {
    if (err.status === 409 && err.error?.campo) {
      const control = this.form.get(err.error.campo);
      if (control) {
        control.setErrors({ apiError: err.error.mensaje });
        return;
      }
    }
    const msg = err.error?.mensaje ?? 'Error al guardar la tienda.';
    this.mostrarToast(msg, 'rojo', 5000);
  }

  private mostrarToast(msg: string, tipo: 'verde' | 'rojo', ms: number): void {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
    this.toastMsg.set(msg);
    this.toastTipo.set(tipo);
    this.toastTimer = setTimeout(() => this.toastMsg.set(''), ms);
  }

  errorDe(campo: string): string {
    const ctrl = this.form.get(campo);
    if (!ctrl?.touched || !ctrl.errors) {
      return '';
    }
    if (ctrl.errors['required']) {
      return 'Este campo es obligatorio.';
    }
    if (ctrl.errors['maxlength']) {
      return `Máximo ${ctrl.errors['maxlength'].requiredLength} caracteres.`;
    }
    if (ctrl.errors['apiError']) {
      return ctrl.errors['apiError'];
    }
    return '';
  }
}
