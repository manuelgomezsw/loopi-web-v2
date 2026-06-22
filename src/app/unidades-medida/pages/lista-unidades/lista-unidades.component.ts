import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { UnidadesMedidaService } from '../../services/unidades-medida.service';
import { ImpactoInactivacionResponse, UnidadMedida } from '../../models/unidad-medida.model';

@Component({
  selector: 'app-lista-unidades',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './lista-unidades.component.html',
})
export class ListaUnidadesComponent implements OnInit, OnDestroy {
  private readonly svc = inject(UnidadesMedidaService);
  private readonly destroy$ = new Subject<void>();

  readonly unidades = signal<UnidadMedida[]>([]);
  readonly total = signal(0);
  readonly cargando = signal(false);
  readonly errorMsg = signal('');
  readonly toastMsg = signal('');
  readonly toastTipo = signal<'verde' | 'rojo'>('verde');

  readonly pagina = signal(1);
  readonly limit = 50;
  readonly filtroTipo = signal('');

  readonly mostrarModalInactivar = signal(false);
  readonly inactivando = signal(false);
  readonly unidadAInactivar = signal<UnidadMedida | null>(null);
  readonly impacto = signal<ImpactoInactivacionResponse | null>(null);

  ngOnInit(): void {
    this.cargar();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargar(): void {
    this.cargando.set(true);
    this.errorMsg.set('');
    const params = {
      page: this.pagina(),
      limit: this.limit,
      tipo: this.filtroTipo() || undefined,
    };
    this.svc
      .listar(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          this.unidades.set(resp.unidades_medida);
          this.total.set(resp.total);
          this.cargando.set(false);
        },
        error: () => {
          this.errorMsg.set('Error al cargar las unidades. Intenta nuevamente.');
          this.cargando.set(false);
        },
      });
  }

  onFiltroTipo(tipo: string): void {
    this.filtroTipo.set(tipo);
    this.pagina.set(1);
    this.cargar();
  }

  paginaAnterior(): void {
    if (this.pagina() > 1) {
      this.pagina.update((p) => p - 1);
      this.cargar();
    }
  }

  paginaSiguiente(): void {
    if (this.pagina() * this.limit < this.total()) {
      this.pagina.update((p) => p + 1);
      this.cargar();
    }
  }

  get hayPaginaAnterior(): boolean {
    return this.pagina() > 1;
  }

  get hayPaginaSiguiente(): boolean {
    return this.pagina() * this.limit < this.total();
  }

  get paginaFin(): number {
    return Math.min(this.pagina() * this.limit, this.total());
  }

  solicitarInactivar(u: UnidadMedida): void {
    this.unidadAInactivar.set(u);
    this.impacto.set(null);
    this.mostrarModalInactivar.set(true);

    this.svc.getImpacto(u.id).subscribe({
      next: (imp) => this.impacto.set(imp),
      error: () => {},
    });
  }

  cancelarInactivar(): void {
    this.mostrarModalInactivar.set(false);
    this.unidadAInactivar.set(null);
    this.impacto.set(null);
  }

  confirmarInactivar(): void {
    const u = this.unidadAInactivar();
    if (!u) return;
    this.inactivando.set(true);
    this.svc.inactivar(u.id).subscribe({
      next: () => {
        this.inactivando.set(false);
        this.mostrarModalInactivar.set(false);
        this.unidadAInactivar.set(null);
        this.impacto.set(null);
        this.mostrarToast(`Unidad "${u.nombre}" inactivada.`, 'verde');
        this.cargar();
      },
      error: (err) => {
        this.inactivando.set(false);
        const msg = err?.error?.mensaje ?? 'Error al inactivar la unidad.';
        this.mostrarToast(msg, 'rojo', 5000);
      },
    });
  }

  mostrarToast(msg: string, tipo: 'verde' | 'rojo', duracion = 3000): void {
    this.toastMsg.set(msg);
    this.toastTipo.set(tipo);
    setTimeout(() => this.toastMsg.set(''), duracion);
  }
}
