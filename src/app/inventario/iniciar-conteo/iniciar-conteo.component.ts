import { Component, OnInit, OnDestroy, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { InventarioService, SugerenciaResp } from '../inventario.service';
import { FormCardComponent } from '../../shared/components/form-card/form-card.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-iniciar-conteo',
  templateUrl: './iniciar-conteo.component.html',
  styleUrls: [],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    FormCardComponent,
    PageHeaderComponent
  ]
})
export class IniciarConteoComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);
  private readonly inventarioService = inject(InventarioService);

  sugerencia: SugerenciaResp | null = null;
  formulario!: FormGroup;

  loadingSugerencia = true;
  sugerenciaError = '';
  iniciarConteoError = '';
  iniciarConteoLoading = false;
  mostrarModalConflicto = false;

  tiendaId = 1;
  estadoConflicto: { activo: boolean; responsable_id?: number; inventario_id?: number } | null = null;

  private destroy$ = new Subject<void>();

  constructor() {
    this.inicializarFormulario();
  }

  private inicializarFormulario(): void {
    this.formulario = this.fb.group({
      tipo: ['', Validators.required],
      horario: ['']
    });

    this.formulario.get('tipo')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(tipo => {
        const horarioControl = this.formulario.get('horario');
        if (tipo === 'diario') {
          horarioControl?.setValidators(Validators.required);
        } else {
          horarioControl?.clearValidators();
          horarioControl?.setValue(null);
        }
        horarioControl?.updateValueAndValidity();
      });
  }

  ngOnInit(): void {
    this.recuperarSesionAbandonada();
    this.cargarSugerencia();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Recuperar conteo en progreso si existe (session recovery).
   * Si hay un inventario activo sin completar, redirige automáticamente.
   */
  private recuperarSesionAbandonada(): void {
    this.inventarioService.getEstadoInventarioActivo(this.tiendaId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (estado) => {
          if (estado.activo && estado.inventario) {
            // Hay conteo en progreso: redirigir a realizar-conteo
            this.router.navigate(['/inventario', estado.inventario.id, 'realizar']);
          }
        },
        error: () => {
          // Si falla la verificación, continuar normalmente
        }
      });
  }

  private cargarSugerencia(): void {
    this.loadingSugerencia = true;
    this.sugerenciaError = '';

    this.inventarioService.getSugerencia()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.sugerencia = data;
          this.formulario.patchValue({
            tipo: data.tipo,
            horario: data.horario || ''
          });
          this.loadingSugerencia = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error al obtener sugerencia:', err);
          this.loadingSugerencia = false;
          this.sugerenciaError = 'No se pudo cargar la sugerencia automática. Ingresa los valores manualmente.';
          this.formulario.patchValue({
            tipo: 'diario',
            horario: ''
          });
          this.cdr.markForCheck();
        }
      });
  }

  iniciarConteo(): void {
    if (!this.formulario.valid) return;

    this.iniciarConteoLoading = true;
    this.iniciarConteoError = '';

    // Verificar si hay conteo activo en la tienda
    this.inventarioService.getEstadoInventarioActivo(this.tiendaId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (estado) => {
          if (estado.activo && estado.inventario) {
            // Hay conteo activo: mostrar modal de conflicto
            this.estadoConflicto = {
              activo: true,
              responsable_id: estado.inventario.responsable_id,
              inventario_id: estado.inventario.id
            };
            this.mostrarModalConflicto = true;
            this.iniciarConteoLoading = false;
            this.cdr.markForCheck();
          } else {
            // No hay conteo activo: proceder a crear nuevo
            this.crearNuevoConteo();
          }
        },
        error: () => {
          // Si falla verificación de estado, intentar crear nuevo igual
          this.crearNuevoConteo();
        }
      });
  }

  private crearNuevoConteo(): void {
    const formValue = this.formulario.value;
    this.inventarioService.iniciarConteo({
      tienda_id: this.tiendaId,
      tipo: formValue.tipo,
      horario: formValue.horario || undefined
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.iniciarConteoLoading = false;
          this.router.navigate(['/inventario', data.id, 'realizar']);
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.iniciarConteoLoading = false;
          this.iniciarConteoError = this.getErrorMessage(err);
          this.cdr.markForCheck();
        }
      });
  }

  reanudaConteo(): void {
    if (!this.estadoConflicto?.inventario_id) return;

    this.iniciarConteoLoading = true;
    this.mostrarModalConflicto = false;

    this.inventarioService.getInventario(this.estadoConflicto.inventario_id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.iniciarConteoLoading = false;
          this.router.navigate(['/inventario', data.id, 'realizar']);
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.iniciarConteoLoading = false;
          this.iniciarConteoError = this.getErrorMessage(err);
          this.mostrarModalConflicto = false;
          this.cdr.markForCheck();
        }
      });
  }

  cerrarModalConflicto(): void {
    this.mostrarModalConflicto = false;
    this.estadoConflicto = null;
    this.cdr.markForCheck();
  }

  private getErrorMessage(err: { error?: { mensaje?: string } }): string {
    return err?.error?.mensaje ?? 'Error al procesar la solicitud. Intenta de nuevo.';
  }
}
