import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { CostoPorTienda, ItemDetalle, ItemsService } from '../items.service';
import { TiendasService, TiendaResponse } from '../../tiendas/tiendas.service';
import { AuthService } from '../../auth/auth.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { FormCardComponent } from '../../shared/components/form-card/form-card.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { ReadonlyFieldComponent } from '../../shared/components/readonly-field/readonly-field.component';

const TIPO_LABELS: Record<string, string> = {
  insumo: 'Insumo',
  material_consumo: 'Material de consumo',
  activo: 'Activo',
};

const FRECUENCIA_LABELS: Record<string, string> = {
  diario: 'Diario',
  semanal: 'Semanal',
  mensual: 'Mensual',
};

@Component({
  selector: 'app-item-detalle',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    PageHeaderComponent,
    FormCardComponent,
    StatusBadgeComponent,
    ReadonlyFieldComponent,
  ],
  templateUrl: './item-detalle.component.html',
})
export class ItemDetalleComponent implements OnInit {
  private readonly svc = inject(ItemsService);
  private readonly tiendasSvc = inject(TiendasService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  readonly itemID = signal<number>(0);
  readonly item = signal<ItemDetalle | null>(null);
  readonly cargando = signal(true);
  readonly errorMsg = signal('');

  readonly esAdmin = () => this.auth.sesion()?.rol === 'admin';

  readonly costoGlobal = signal<number | null>(null);
  readonly costosPorTienda = signal<CostoPorTienda[]>([]);
  readonly cargandoCostos = signal(false);
  readonly tiendas = signal<TiendaResponse[]>([]);
  readonly guardandoCosto = signal(false);

  readonly mostrarModalCambioEstado = signal(false);
  readonly cambiandoEstado = signal(false);
  readonly toastMsg = signal('');
  readonly toastTipo = signal<'verde' | 'rojo'>('verde');
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  readonly tipoLabels = TIPO_LABELS;
  readonly frecuenciaLabels = FRECUENCIA_LABELS;

  costoForm!: FormGroup;

  ngOnInit(): void {
    this.costoForm = this.fb.group({
      tienda_id: [null, [Validators.required]],
      costo_unitario: [null, [Validators.required, Validators.min(1)]],
    });

    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.itemID.set(id);
    this.cargarItem();

    if (this.esAdmin()) {
      this.cargarCostos();
      this.tiendasSvc.listar('activo', 1, 200).subscribe({
        next: (resp) => this.tiendas.set(resp.datos),
        error: () => undefined,
      });
    }
  }

  cargarItem(): void {
    this.cargando.set(true);
    this.errorMsg.set('');
    this.svc.obtenerItem(this.itemID()).subscribe({
      next: (it) => {
        this.item.set(it);
        this.cargando.set(false);
      },
      error: () => {
        this.errorMsg.set('Error al cargar el item.');
        this.cargando.set(false);
      },
    });
  }

  cargarCostos(): void {
    this.cargandoCostos.set(true);
    this.svc.obtenerCostosTienda(this.itemID()).subscribe({
      next: (resp) => {
        this.costoGlobal.set(resp.costo_global);
        this.costosPorTienda.set(resp.costos_por_tienda);
        this.cargandoCostos.set(false);
      },
      error: () => {
        this.cargandoCostos.set(false);
      },
    });
  }

  costoVigenteDeTienda(tiendaId: number): number | null {
    const entrada = this.costosPorTienda().find((c) => c.tienda_id === tiendaId);
    return entrada ? entrada.costo_vigente : null;
  }

  registrarCosto(): void {
    this.costoForm.markAllAsTouched();
    if (this.costoForm.invalid) return;

    this.guardandoCosto.set(true);
    const v = this.costoForm.getRawValue();
    this.svc
      .registrarCostoTienda(this.itemID(), {
        tienda_id: Number(v.tienda_id),
        costo_unitario: Number(v.costo_unitario),
      })
      .subscribe({
        next: () => {
          this.guardandoCosto.set(false);
          this.costoForm.reset();
          this.mostrarToast('Costo por tienda registrado correctamente.', 'verde', 3000);
          this.cargarCostos();
        },
        error: (err) => {
          this.guardandoCosto.set(false);
          const msg = err?.error?.mensaje ?? 'Error al registrar el costo por tienda.';
          this.mostrarToast(msg, 'rojo', 5000);
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
    const id = this.itemID();
    const activo = this.item()?.activo ?? true;
    this.cambiandoEstado.set(true);
    const accion$ = activo ? this.svc.inactivarItem(id) : this.svc.reactivarItem(id);
    accion$.subscribe({
      next: () => {
        this.cambiandoEstado.set(false);
        this.mostrarModalCambioEstado.set(false);
        this.cargarItem();
      },
      error: (err) => {
        this.cambiandoEstado.set(false);
        this.mostrarModalCambioEstado.set(false);
        const msg = err?.error?.mensaje ?? 'Error al cambiar el estado del item.';
        this.mostrarToast(msg, 'rojo', 5000);
      },
    });
  }

  private mostrarToast(msg: string, tipo: 'verde' | 'rojo', ms: number): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastMsg.set(msg);
    this.toastTipo.set(tipo);
    this.toastTimer = setTimeout(() => this.toastMsg.set(''), ms);
  }

  irAEditar(): void {
    this.router.navigate(['/items', this.itemID(), 'editar']);
  }
}
