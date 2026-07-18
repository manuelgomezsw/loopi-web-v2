import { Component, OnInit, OnDestroy, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { InventarioService, SugerenciaResp, InventarioResp } from './inventario.service';
import { FormCardComponent } from '../shared/components/form-card/form-card.component';
import { PageHeaderComponent } from '../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-inventario-conteo',
  templateUrl: './inventario-conteo.component.html',
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
export class InventarioConteoComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);

  sugerencia: SugerenciaResp | null = null;
  inventarioActual: InventarioResp | null = null;
  step: 'select' | 'register' | 'confirm' | 'complete' = 'select';

  formData = {
    tienda_id: 1,
    tipo: '',
    horario: '' as string | undefined
  };

  formulario!: FormGroup;
  valoresRegistrados = new Map<number, number>();
  itemErrors = new Map<number, string>();
  loadingItems = new Set<number>();
  confirmationError = '';
  itemsSinRegistrar: number[] = [];
  isConfirming = false;
  loadingSugerencia = true;
  sugerenciaError = '';
  iniciarConteoError = '';
  iniciarConteoLoading = false;
  estadoConflicto: { activo: boolean; responsable_id?: number; inventario_id?: number } | null = null;
  mostrarModalConflicto = false;

  private destroy$ = new Subject<void>();

  constructor(
    private inventarioService: InventarioService,
    private route: ActivatedRoute
  ) {
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
        }
        horarioControl?.updateValueAndValidity();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit(): void {
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const inventarioId = params['inventario_id'];
        if (inventarioId) {
          this.recuperarSesion(parseInt(inventarioId, 10));
        } else {
          this.loadSugerencia();
        }
      });
  }

  loadSugerencia(): void {
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
          this.formData.tipo = data.tipo;
          this.formData.horario = data.horario;
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

  recuperarSesion(inventarioId: number): void {
    this.inventarioService.getInventario(inventarioId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          if (data.estado === 'en_progreso') {
            this.inventarioActual = data;
            this.formData.tipo = data.tipo;
            this.formData.horario = data.horario;
            this.step = 'register';
            this.precargarvValoresReales();
            this.cdr.markForCheck();
          } else {
            this.loadSugerencia();
          }
        },
        error: (err) => {
          console.error('Error recuperando sesión:', err);
          this.loadSugerencia();
        }
      });
  }

  precargarvValoresReales(): void {
    if (!this.inventarioActual) return;
    this.inventarioActual.items.forEach(item => {
      if (item.valor_real !== null && item.valor_real !== undefined) {
        this.valoresRegistrados.set(item.item_id, item.valor_real);
      }
    });
  }

  iniciarConteo(): void {
    if (!this.formulario.valid) return;

    this.iniciarConteoLoading = true;
    this.iniciarConteoError = '';

    // Primero: Verificar si hay conteo activo en la tienda
    this.inventarioService.getEstadoInventarioActivo(this.formData.tienda_id)
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
      tienda_id: this.formData.tienda_id,
      tipo: formValue.tipo,
      horario: formValue.horario || undefined
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.inventarioActual = data;
          this.step = 'register';
          this.iniciarConteoLoading = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.iniciarConteoLoading = false;
          const errorMsg = err.error?.error_message || 'No se pudo iniciar el conteo. Intenta de nuevo.';
          this.iniciarConteoError = errorMsg;
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
          this.inventarioActual = data;
          this.step = 'register';
          this.iniciarConteoLoading = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.iniciarConteoLoading = false;
          const errorMsg = err.error?.error_message || 'No se pudo reanudar el conteo. Intenta de nuevo.';
          this.iniciarConteoError = errorMsg;
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

  registrarValor(itemId: number, valor: number): void {
    if (!this.inventarioActual) return;

    this.loadingItems.add(itemId);
    this.itemErrors.delete(itemId);

    this.inventarioService.registrarValorReal(this.inventarioActual.id, itemId, valor)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.valoresRegistrados.set(itemId, valor);
          this.itemErrors.delete(itemId);
          const item = this.inventarioActual!.items.find(i => i.item_id === itemId);
          if (item) {
            item.valor_real = data.valor_real;
            item.diferencia = data.diferencia;
          }
          this.loadingItems.delete(itemId);
        },
        error: (err) => {
          const errorMsg = err?.error?.mensaje || 'Error temporal al guardar valor';
          this.itemErrors.set(itemId, errorMsg);
          this.loadingItems.delete(itemId);
        }
      });
  }

  reintentar(itemId: number): void {
    const valor = this.valoresRegistrados.get(itemId);
    if (valor !== undefined) {
      this.registrarValor(itemId, valor);
    }
  }

  confirmarConteo(): void {
    if (!this.inventarioActual) return;

    this.isConfirming = true;
    this.confirmationError = '';
    this.itemsSinRegistrar = [];

    this.inventarioService.confirmarConteo(this.inventarioActual.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.inventarioActual = data;
          this.isConfirming = false;
          this.step = 'complete';
        },
        error: (err) => {
          this.isConfirming = false;
          const status = err?.status;
          const errorCode = err?.error?.error;

          if (status === 422 && errorCode === 'items_sin_registrar') {
            this.itemsSinRegistrar = err.error?.detalles?.items_sin_registrar || [];
            this.confirmationError = 'Hay items sin registrar. Por favor completa todos antes de confirmar.';
            this.step = 'register';
          } else if (status === 409) {
            this.confirmationError = 'Este conteo ya fue completado anteriormente.';
          } else if (status === 403) {
            this.confirmationError = 'No tienes permiso para confirmar este conteo.';
          } else {
            this.confirmationError = err?.error?.mensaje || 'Error al confirmar conteo';
          }
        }
    });
  }

  todosRegistrados(): boolean {
    if (!this.inventarioActual) return false;
    return this.inventarioActual.items.every(item => item.valor_real !== null && item.valor_real !== undefined);
  }

  volver(): void {
    if (this.step === 'register') {
      this.step = 'select';
    } else if (this.step === 'confirm') {
      this.step = 'register';
    }
  }
}
