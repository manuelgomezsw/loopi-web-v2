import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { UnidadesMedidaService } from '../../services/unidades-medida.service';
import { UnidadMedidaDetalle } from '../../models/unidad-medida.model';

@Component({
  selector: 'app-detalle-unidad',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './detalle-unidad.component.html',
})
export class DetalleUnidadComponent implements OnInit, OnDestroy {
  private readonly svc = inject(UnidadesMedidaService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroy$ = new Subject<void>();

  readonly unidad = signal<UnidadMedidaDetalle | null>(null);
  readonly cargando = signal(true);
  readonly errorMsg = signal('');

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.svc
      .obtener(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (u) => {
          this.unidad.set(u);
          this.cargando.set(false);
        },
        error: () => {
          this.errorMsg.set('No se pudo cargar la unidad de medida.');
          this.cargando.set(false);
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
