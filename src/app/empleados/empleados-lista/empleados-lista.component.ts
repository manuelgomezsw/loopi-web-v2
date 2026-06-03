import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

import { Empleado, EmpleadosService } from '../empleados.service';

@Component({
  selector: 'app-empleados-lista',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './empleados-lista.component.html',
})
export class EmpleadosListaComponent implements OnInit, OnDestroy {
  private readonly svc = inject(EmpleadosService);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();
  private readonly busqueda$ = new Subject<string>();

  readonly empleados = signal<Empleado[]>([]);
  readonly total = signal<number>(0);
  readonly cargando = signal<boolean>(false);
  readonly errorMsg = signal<string>('');
  readonly toastMsg = signal<string>('');
  readonly toastTipo = signal<'verde' | 'rojo'>('verde');

  readonly pagina = signal<number>(1);
  readonly limit = 20;
  readonly busqueda = signal<string>('');

  ngOnInit(): void {
    this.busqueda$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.pagina.set(1);
        this.cargar();
      });
    this.cargar();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onBusqueda(q: string): void {
    this.busqueda.set(q);
    this.busqueda$.next(q);
  }

  cargar(): void {
    this.cargando.set(true);
    this.errorMsg.set('');
    this.svc
      .listar({ q: this.busqueda(), page: this.pagina(), limit: this.limit })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          this.empleados.set(resp.empleados);
          this.total.set(resp.total);
          this.cargando.set(false);
        },
        error: () => {
          this.errorMsg.set('Error al cargar los empleados. Intenta nuevamente.');
          this.cargando.set(false);
        },
      });
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

  irAEditar(id: number): void {
    this.router.navigate(['/empleados', id, 'editar']);
  }

  get hayPaginaAnterior(): boolean {
    return this.pagina() > 1;
  }

  get hayPaginaSiguiente(): boolean {
    return this.pagina() * this.limit < this.total();
  }

  mostrarToast(msg: string, tipo: 'verde' | 'rojo', duracion = 3000): void {
    this.toastMsg.set(msg);
    this.toastTipo.set(tipo);
    setTimeout(() => this.toastMsg.set(''), duracion);
  }
}
