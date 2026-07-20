import { Component, OnInit, OnDestroy, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { InventarioService, InventarioResp } from '../inventario.service';
import { FormCardComponent } from '../../shared/components/form-card/form-card.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-realizar-conteo',
  templateUrl: './realizar-conteo.component.html',
  styleUrls: ['./realizar-conteo.component.css'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    FormCardComponent,
    PageHeaderComponent
  ]
})
export class RealizarConteoComponent implements OnInit, OnDestroy {
  private readonly cdr = inject(ChangeDetectorRef);

  inventarioActual: InventarioResp | null = null;
  valoresRegistrados = new Map<number, number>();
  itemErrors = new Map<number, string>();
  loadingItems = new Set<number>();

  private destroy$ = new Subject<void>();

  constructor(
    private inventarioService: InventarioService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const inventarioId = parseInt(params['id'], 10);
      this.cargarInventario(inventarioId);
    });
  }

  private cargarInventario(inventarioId: number): void {
    this.inventarioService.getInventario(inventarioId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.inventarioActual = data;
          this.precargarvValoresReales();
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error cargando inventario:', err);
          this.router.navigate(['/inventario']);
        }
      });
  }

  private precargarvValoresReales(): void {
    if (!this.inventarioActual) return;
    this.inventarioActual.items.forEach(item => {
      if (item.valor_real !== null && item.valor_real !== undefined) {
        this.valoresRegistrados.set(item.item_id, item.valor_real);
      }
    });
  }

  registrarValor(itemId: number, valor: number): void {
    if (!this.inventarioActual) return;

    // Validación: rechazar valores negativos (RF-INV-02.1)
    if (valor < 0) {
      this.itemErrors.set(itemId, 'La cantidad no puede ser negativa. Ingrese un valor mayor o igual a 0.');
      this.cdr.markForCheck();
      return;
    }

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
          this.cdr.markForCheck();
        },
        error: (err) => {
          const errorMsg = err?.error?.mensaje || 'Error al registrar valor';
          this.itemErrors.set(itemId, errorMsg);
          this.loadingItems.delete(itemId);
          this.cdr.markForCheck();
        }
      });
  }

  reintentar(itemId: number): void {
    const valor = this.valoresRegistrados.get(itemId);
    if (valor !== undefined) {
      this.registrarValor(itemId, valor);
    }
  }

  todosRegistrados(): boolean {
    if (!this.inventarioActual) return false;
    return this.inventarioActual.items.every(
      item => item.valor_real !== null &&
              item.valor_real !== undefined &&
              item.valor_real >= 0
    );
  }

  tieneValoresNegativos(): boolean {
    if (!this.inventarioActual || !this.inventarioActual.items) return false;
    return this.inventarioActual.items.some(
      item => item.valor_real !== null && item.valor_real !== undefined && item.valor_real < 0
    );
  }

  irAConfirmacion(): void {
    if (this.inventarioActual) {
      this.router.navigate(['/inventario', this.inventarioActual.id, 'confirmar']);
    }
  }

  cancelar(): void {
    this.router.navigate(['/inventario/iniciar']);
  }
}
