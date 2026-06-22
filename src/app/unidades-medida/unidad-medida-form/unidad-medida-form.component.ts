import { Component, inject, OnInit, signal } from '@angular/core';
import { catchError, EMPTY } from 'rxjs';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

import {
  ImpactoInactivacionResponse,
  UnidadMedida,
  UnidadesMedidaService,
} from '../unidades-medida.service';
import { FormModeService } from '../../shared/services/form-mode.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { FormCardComponent } from '../../shared/components/form-card/form-card.component';
import { DangerZoneComponent } from '../../shared/components/danger-zone/danger-zone.component';
@Component({
  selector: 'app-unidad-medida-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, PageHeaderComponent, FormCardComponent, DangerZoneComponent],
  providers: [FormModeService],
  templateUrl: './unidad-medida-form.component.html',
})
export class UnidadMedidaFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly svc = inject(UnidadesMedidaService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly formMode = inject(FormModeService);

  readonly modoEdicion = this.formMode.isEdit;
  readonly unidadID = signal<number | null>(null);
  readonly esUnidadBase = signal(false);
  readonly guardando = signal(false);
  readonly toastMsg = signal('');
  readonly toastTipo = signal<'verde' | 'rojo'>('verde');
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  readonly unidad = signal<UnidadMedida | null>(null);
  readonly mostrarModalInactivar = signal(false);
  readonly inactivando = signal(false);
  readonly impacto = signal<ImpactoInactivacionResponse | null>(null);

  readonly tiposMedida = ['peso', 'volumen', 'unidad'];

  form!: FormGroup;

  ngOnInit(): void {
    this.form = this.fb.group({
      codigo: ['', [Validators.required, Validators.maxLength(20), Validators.pattern(/^[A-Za-z0-9_]+$/)]],
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      tipo_medida: ['', Validators.required],
      factor_conversion: [null, [Validators.required, Validators.min(0.0001)]],
      unidad_base: [false],
    });

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const id = Number(idParam);
      this.formMode.mode.set('edit');
      this.unidadID.set(id);
      this.form.get('codigo')?.disable();
      this.form.get('tipo_medida')?.disable();
      this.cargarUnidad(id);
    }
  }

  private cargarUnidad(id: number): void {
    this.svc.obtener(id).subscribe({
      next: (u) => {
        this.unidad.set(u);
        this.esUnidadBase.set(u.unidad_base);
        if (u.unidad_base) {
          this.form.get('factor_conversion')?.disable();
        }
        this.form.patchValue({
          codigo: u.codigo,
          nombre: u.nombre,
          tipo_medida: u.tipo_medida,
          factor_conversion: u.factor_conversion,
          unidad_base: u.unidad_base,
        });
      },
      error: () => {
        this.mostrarToast('Error al cargar los datos de la unidad.', 'rojo', 5000);
      },
    });
  }

  solicitarInactivar(): void {
    this.impacto.set(null);
    this.mostrarModalInactivar.set(true);
    this.svc.getImpacto(this.unidadID()!).pipe(catchError(() => EMPTY)).subscribe((imp) => this.impacto.set(imp));
  }

  cancelarInactivar(): void {
    this.mostrarModalInactivar.set(false);
    this.impacto.set(null);
  }

  confirmarInactivar(): void {
    this.inactivando.set(true);
    this.svc.inactivar(this.unidadID()!).subscribe({
      next: () => {
        this.inactivando.set(false);
        this.mostrarModalInactivar.set(false);
        this.router.navigate(['/unidades-medida']);
      },
      error: (err) => {
        this.inactivando.set(false);
        this.mostrarModalInactivar.set(false);
        const msg = err?.error?.mensaje ?? 'Error al inactivar la unidad.';
        this.mostrarToast(msg, 'rojo', 5000);
      },
    });
  }

  enviar(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.guardando.set(true);

    if (this.modoEdicion()) {
      const id = this.unidadID()!;
      const req: { nombre?: string; factor_conversion?: number } = {
        nombre: this.form.get('nombre')?.value,
      };
      if (!this.esUnidadBase()) {
        req.factor_conversion = this.form.get('factor_conversion')?.value;
      }
      this.svc.editar(id, req).subscribe({
        next: () => {
          this.guardando.set(false);
          this.mostrarToast('Unidad actualizada correctamente.', 'verde', 3000);
          setTimeout(() => this.router.navigate(['/unidades-medida']), 1500);
        },
        error: (err) => {
          this.guardando.set(false);
          this.handleApiError(err);
        },
      });
    } else {
      this.svc.crear(this.form.getRawValue()).subscribe({
        next: () => {
          this.guardando.set(false);
          this.mostrarToast('Unidad creada correctamente.', 'verde', 3000);
          setTimeout(() => this.router.navigate(['/unidades-medida']), 1500);
        },
        error: (err) => {
          this.guardando.set(false);
          this.handleApiError(err);
        },
      });
    }
  }

  private handleApiError(err: { status?: number; error?: { campo?: string; mensaje?: string } }): void {
    if (err.status === 409 && err.error?.campo) {
      const control = this.form.get(err.error.campo);
      if (control) {
        control.setErrors({ apiError: err.error.mensaje });
        return;
      }
    }
    const msg = err.error?.mensaje ?? 'Error al guardar la unidad de medida.';
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
    if (ctrl.errors['min']) return 'El factor debe ser mayor que cero.';
    if (ctrl.errors['pattern']) return 'Solo letras, números y guión bajo.';
    if (ctrl.errors['apiError']) return ctrl.errors['apiError'];
    return '';
  }
}
