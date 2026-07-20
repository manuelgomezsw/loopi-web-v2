import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';

import { CostoPorTienda, ItemDetalle, ItemsService } from '../items.service';
import { CategoriasService, Categoria } from '../../categorias/categorias.service';
import { ProveedoresService, Proveedor } from '../../proveedores/proveedores.service';
import { UnidadesMedidaService, UnidadMedida } from '../../unidades-medida/unidades-medida.service';
import { TiendasService, TiendaResponse } from '../../tiendas/tiendas.service';
import { AuthService } from '../../auth/auth.service';
import { FormModeService } from '../../shared/services/form-mode.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { FormCardComponent } from '../../shared/components/form-card/form-card.component';
import { DangerZoneComponent } from '../../shared/components/danger-zone/danger-zone.component';
import { ReadonlyFieldComponent } from '../../shared/components/readonly-field/readonly-field.component';

interface SubcategoriaOpcion {
  id: number;
  etiqueta: string;
}

const TIPO_LABELS: Record<string, string> = {
  insumo: 'Insumo',
  material_consumo: 'Material de consumo',
  activo: 'Activo',
};

@Component({
  selector: 'app-item-form',
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
  templateUrl: './item-form.component.html',
})
export class ItemFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly svc = inject(ItemsService);
  private readonly categoriasSvc = inject(CategoriasService);
  private readonly proveedoresSvc = inject(ProveedoresService);
  private readonly unidadesSvc = inject(UnidadesMedidaService);
  private readonly tiendasSvc = inject(TiendasService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly formMode = inject(FormModeService);

  readonly modoEdicion = this.formMode.isEdit;
  readonly esAdmin = () => this.auth.sesion()?.rol === 'admin';
  readonly titulo = () => {
    if (!this.modoEdicion()) return 'Nuevo item';
    return this.esAdmin() ? 'Editar item' : 'Detalle del item';
  };

  readonly itemID = signal<number | null>(null);
  readonly item = signal<ItemDetalle | null>(null);
  readonly guardando = signal(false);
  readonly cargandoOpciones = signal(true);
  readonly toastMsg = signal('');
  readonly toastTipo = signal<'verde' | 'rojo'>('verde');
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  readonly mostrarModalCambioEstado = signal(false);
  readonly cambiandoEstado = signal(false);
  readonly mostrarModalUnidad = signal(false);

  readonly subcategorias = signal<SubcategoriaOpcion[]>([]);
  readonly proveedores = signal<Proveedor[]>([]);
  readonly unidadesMedida = signal<UnidadMedida[]>([]);

  // Costos por tienda — exclusivo admin, solo en modo edición.
  readonly costoGlobal = signal<number | null>(null);
  readonly costosPorTienda = signal<CostoPorTienda[]>([]);
  readonly cargandoCostos = signal(false);
  readonly tiendas = signal<TiendaResponse[]>([]);
  readonly guardandoCosto = signal(false);
  costoForm!: FormGroup;

  readonly tipoLabels = TIPO_LABELS;

  form!: FormGroup;

  ngOnInit(): void {
    this.form = this.fb.group({
      codigo: ['', [Validators.required, Validators.maxLength(20)]],
      nombre: ['', [Validators.required, Validators.maxLength(150)]],
      tipo: ['insumo', [Validators.required]],
      subcategoria_id: [null, [Validators.required]],
      unidad_medida_id: [null, [Validators.required]],
      proveedor_id: [null],
      tiempo_entrega_dias: [null],
      costo_unitario: [null],
      frecuencia_inventario: ['diario', [Validators.required]],
      stock_seguridad: ['0', [Validators.required]],
    });
    this.costoForm = this.fb.group({
      tienda_id: [null, [Validators.required]],
      costo_unitario: [null, [Validators.required, Validators.min(1)]],
    });

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.formMode.mode.set('edit');
      this.itemID.set(Number(idParam));
    }

    this.cargarOpciones();
  }

  private cargarOpciones(): void {
    forkJoin({
      catalogo: this.categoriasSvc.obtenerCatalogo('activo'),
      proveedores: this.proveedoresSvc.listar({ estado: 'activo', limit: 200 }),
      unidades: this.unidadesSvc.listar({ estado: 'activo', limit: 200 }),
    }).subscribe({
      next: ({ catalogo, proveedores, unidades }) => {
        this.subcategorias.set(this.flattenSubcategorias(catalogo.categorias));
        this.proveedores.set(proveedores.proveedores);
        this.unidadesMedida.set(unidades.unidades_medida);
        this.cargandoOpciones.set(false);

        const id = this.itemID();
        if (id) {
          this.cargarItem(id);
        }
      },
      error: () => {
        this.cargandoOpciones.set(false);
        this.mostrarToast('Error al cargar las opciones del formulario.', 'rojo', 5000);
      },
    });
  }

  private flattenSubcategorias(categorias: Categoria[]): SubcategoriaOpcion[] {
    const opciones: SubcategoriaOpcion[] = [];
    for (const cat of categorias) {
      for (const sub of cat.subcategorias) {
        if (sub.activo) {
          opciones.push({ id: sub.id, etiqueta: `${cat.nombre} > ${sub.nombre}` });
        }
      }
    }
    return opciones;
  }

  private cargarItem(id: number): void {
    this.svc.obtenerItem(id).subscribe({
      next: (it) => {
        this.item.set(it);
        this.form.patchValue({
          codigo: it.codigo,
          nombre: it.nombre,
          tipo: it.tipo,
          subcategoria_id: it.subcategoria_id,
          proveedor_id: it.proveedor_id,
          unidad_medida_id: it.unidad_medida_id,
          costo_unitario: it.costo_unitario,
          frecuencia_inventario: it.frecuencia_inventario,
          stock_seguridad: it.stock_seguridad,
          tiempo_entrega_dias: it.tiempo_entrega_dias,
        });
        this.form.get('tipo')?.disable();
        if (it.esta_en_uso) {
          this.form.get('codigo')?.disable();
        }
        if (!this.esAdmin()) {
          // Lectura únicamente: los roles no-admin pueden consultar el catálogo pero no
          // editarlo (RBAC). Reutilizamos el mismo formulario como vista de detalle en
          // lugar de una pantalla de solo lectura separada (ver FE-LISTFORM-01).
          this.form.disable();
        }

        if (this.esAdmin()) {
          this.cargarCostos(id);
          this.tiendasSvc.listar('activo', 1, 200).subscribe({
            next: (resp) => this.tiendas.set(resp.datos),
            error: () => undefined,
          });
        }
      },
      error: () => {
        this.mostrarToast('Error al cargar los datos del item.', 'rojo', 5000);
      },
    });
  }

  private cargarCostos(id: number): void {
    this.cargandoCostos.set(true);
    this.svc.obtenerCostosTienda(id).subscribe({
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

    const id = this.itemID();
    if (!id) return;

    this.guardandoCosto.set(true);
    const v = this.costoForm.getRawValue();
    this.svc
      .registrarCostoTienda(id, { tienda_id: Number(v.tienda_id), costo_unitario: Number(v.costo_unitario) })
      .subscribe({
        next: () => {
          this.guardandoCosto.set(false);
          this.costoForm.reset();
          this.mostrarToast('Costo por tienda registrado correctamente.', 'verde', 3000);
          this.cargarCostos(id);
        },
        error: (err) => {
          this.guardandoCosto.set(false);
          const msg = err?.error?.mensaje ?? 'Error al registrar el costo por tienda.';
          this.mostrarToast(msg, 'rojo', 5000);
        },
      });
  }

  unidadCambio(): boolean {
    const original = this.item();
    if (!original) return false;
    return Number(this.form.get('unidad_medida_id')?.value) !== original.unidad_medida_id;
  }

  solicitarCambioEstado(): void {
    this.mostrarModalCambioEstado.set(true);
  }

  cancelarCambioEstado(): void {
    this.mostrarModalCambioEstado.set(false);
  }

  confirmarCambioEstado(): void {
    const id = this.itemID()!;
    const activo = this.item()?.activo ?? true;
    this.cambiandoEstado.set(true);
    const accion$ = activo ? this.svc.inactivarItem(id) : this.svc.reactivarItem(id);
    accion$.subscribe({
      next: () => {
        this.cambiandoEstado.set(false);
        this.mostrarModalCambioEstado.set(false);
        this.router.navigate(['/items']);
      },
      error: (err) => {
        this.cambiandoEstado.set(false);
        this.mostrarModalCambioEstado.set(false);
        const msg = err?.error?.mensaje ?? 'Error al cambiar el estado del item.';
        this.mostrarToast(msg, 'rojo', 5000);
      },
    });
  }

  enviar(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    if (this.modoEdicion() && this.unidadCambio() && !this.mostrarModalUnidad()) {
      this.mostrarModalUnidad.set(true);
      return;
    }

    this.guardar(this.unidadCambio());
  }

  cancelarCambioUnidad(): void {
    this.mostrarModalUnidad.set(false);
  }

  confirmarCambioUnidad(): void {
    this.mostrarModalUnidad.set(false);
    this.guardar(true);
  }

  private guardar(confirmarCambioUnidad: boolean): void {
    this.guardando.set(true);
    const v = this.form.getRawValue();

    if (this.modoEdicion()) {
      const req = {
        codigo: v.codigo || undefined,
        nombre: v.nombre,
        subcategoria_id: Number(v.subcategoria_id),
        proveedor_id: v.proveedor_id ? Number(v.proveedor_id) : undefined,
        unidad_medida_id: Number(v.unidad_medida_id),
        costo_unitario: v.costo_unitario !== null && v.costo_unitario !== '' ? Number(v.costo_unitario) : undefined,
        frecuencia_inventario: v.frecuencia_inventario,
        stock_seguridad: String(v.stock_seguridad),
        tiempo_entrega_dias: v.tiempo_entrega_dias !== null && v.tiempo_entrega_dias !== '' ? Number(v.tiempo_entrega_dias) : undefined,
        confirmar_cambio_unidad: confirmarCambioUnidad,
      };
      this.svc.editarItem(this.itemID()!, req).subscribe({
        next: () => {
          this.guardando.set(false);
          this.mostrarToast('Item actualizado correctamente.', 'verde', 3000);
          setTimeout(() => this.router.navigate(['/items']), 1500);
        },
        error: (err) => {
          this.guardando.set(false);
          this.handleApiError(err);
        },
      });
    } else {
      const req = {
        codigo: v.codigo,
        nombre: v.nombre,
        tipo: v.tipo,
        subcategoria_id: Number(v.subcategoria_id),
        proveedor_id: v.proveedor_id ? Number(v.proveedor_id) : undefined,
        unidad_medida_id: Number(v.unidad_medida_id),
        costo_unitario: v.costo_unitario !== null && v.costo_unitario !== '' ? Number(v.costo_unitario) : undefined,
        frecuencia_inventario: v.frecuencia_inventario,
        stock_seguridad: String(v.stock_seguridad),
        tiempo_entrega_dias: v.tiempo_entrega_dias !== null && v.tiempo_entrega_dias !== '' ? Number(v.tiempo_entrega_dias) : undefined,
      };
      this.svc.crearItem(req).subscribe({
        next: () => {
          this.guardando.set(false);
          this.mostrarToast('Item creado correctamente.', 'verde', 3000);
          setTimeout(() => this.router.navigate(['/items']), 1500);
        },
        error: (err) => {
          this.guardando.set(false);
          this.handleApiError(err);
        },
      });
    }
  }

  private handleApiError(err: { status?: number; error?: { campo?: string; mensaje?: string } }): void {
    if ((err.status === 409 || err.status === 400 || err.status === 422) && err.error?.campo) {
      const control = this.form.get(err.error.campo);
      if (control) {
        control.setErrors({ apiError: err.error.mensaje });
        return;
      }
    }
    const msg = err.error?.mensaje ?? 'Error al guardar el item.';
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
    if (ctrl.errors['apiError']) return ctrl.errors['apiError'];
    return '';
  }
}
