import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { ItemFormComponent } from './item-form.component';
import { HistorialCostosResponse, ItemDetalle, ItemsService } from '../items.service';
import { CategoriasService, CatalogoResponse } from '../../categorias/categorias.service';
import { ProveedoresService, ListarProveedoresResponse } from '../../proveedores/proveedores.service';
import { UnidadesMedidaService, ListarUnidadesMedidaResponse } from '../../unidades-medida/unidades-medida.service';
import { TiendasService, ListaTiendasResponse } from '../../tiendas/tiendas.service';
import { AuthService } from '../../auth/auth.service';

const catalogoVacio: CatalogoResponse = {
  categorias: [
    {
      id: 1,
      nombre: 'Lácteos',
      activo: true,
      creado_por: 1,
      creado_en: '',
      actualizado_por: 1,
      actualizado_en: '',
      subcategorias: [
        { id: 3, nombre: 'Líquidos', categoria_id: 1, activo: true, creado_por: 1, creado_en: '', actualizado_por: 1, actualizado_en: '', total_items: 0 },
      ],
    },
  ],
  total: 1,
};

const proveedoresVacio: ListarProveedoresResponse = { proveedores: [], total: 0, page: 1, limit: 200 };
const unidadesVacio: ListarUnidadesMedidaResponse = { unidades_medida: [], total: 0, page: 1, limit: 200 };
const tiendasVacio: ListaTiendasResponse = { datos: [], total: 0, pagina: 1, limite: 200 };

const itemEjemplo: ItemDetalle = {
  id: 1,
  codigo: 'LEC-001',
  nombre: 'Leche Entera',
  tipo: 'insumo',
  subcategoria_id: 3,
  subcategoria_nombre: 'Lácteos > Líquidos',
  proveedor_id: null,
  proveedor_nombre: null,
  unidad_medida_id: 5,
  unidad_medida_simbolo: 'ml',
  costo_unitario: 3200,
  frecuencia_inventario: 'diario',
  stock_seguridad: '10000.0000',
  tiempo_entrega_dias: 2,
  activo: true,
  esta_en_uso: false,
  creado_por: 1,
  creado_en: '2026-05-24T10:00:00',
  actualizado_por: 1,
  actualizado_en: '2026-05-24T10:00:00',
};

const historialEjemplo: HistorialCostosResponse = {
  item_id: 1,
  costo_global: 3200,
  costos_por_tienda: [
    {
      tienda_id: 1,
      tienda_nombre: 'Sede Norte',
      costo_vigente: 3600,
      historial: [{ id: 5, costo_unitario: 3600, vigente_desde: '2026-05-20T09:00:00', creado_por: 1, creado_en: '2026-05-20T09:00:00' }],
    },
  ],
};

function mockRoute(id: string | null) {
  return { snapshot: { paramMap: { get: () => id } } };
}

async function setupComponent(idParam: string | null, itemMock: ItemDetalle = itemEjemplo, rol = 'admin') {
  const itemsSvc = jasmine.createSpyObj<ItemsService>('ItemsService', [
    'crearItem', 'obtenerItem', 'editarItem', 'inactivarItem', 'reactivarItem', 'obtenerCostosTienda', 'registrarCostoTienda',
  ]);
  if (idParam) itemsSvc.obtenerItem.and.returnValue(of(itemMock));
  itemsSvc.obtenerCostosTienda.and.returnValue(of(historialEjemplo));

  const categoriasSvc = jasmine.createSpyObj<CategoriasService>('CategoriasService', ['obtenerCatalogo']);
  categoriasSvc.obtenerCatalogo.and.returnValue(of(catalogoVacio));

  const proveedoresSvc = jasmine.createSpyObj<ProveedoresService>('ProveedoresService', ['listar']);
  proveedoresSvc.listar.and.returnValue(of(proveedoresVacio));

  const unidadesSvc = jasmine.createSpyObj<UnidadesMedidaService>('UnidadesMedidaService', ['listar']);
  unidadesSvc.listar.and.returnValue(of(unidadesVacio));

  const tiendasSvc = jasmine.createSpyObj<TiendasService>('TiendasService', ['listar']);
  tiendasSvc.listar.and.returnValue(of(tiendasVacio));

  await TestBed.configureTestingModule({
    imports: [ItemFormComponent],
    providers: [
      provideRouter([]),
      { provide: ItemsService, useValue: itemsSvc },
      { provide: CategoriasService, useValue: categoriasSvc },
      { provide: ProveedoresService, useValue: proveedoresSvc },
      { provide: UnidadesMedidaService, useValue: unidadesSvc },
      { provide: TiendasService, useValue: tiendasSvc },
      { provide: AuthService, useValue: { sesion: () => ({ rol, tienda_id: null }) } },
      { provide: ActivatedRoute, useValue: mockRoute(idParam) },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(ItemFormComponent);
  const component = fixture.componentInstance;
  fixture.detectChanges();

  return { fixture, component, itemsSvc, tiendasSvc };
}

describe('ItemFormComponent — modo creación', () => {
  let component: ItemFormComponent;

  beforeEach(async () => {
    ({ component } = await setupComponent(null));
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('el campo tipo está habilitado y editable en modo creación', () => {
    expect(component.form.get('tipo')?.disabled).toBeFalse();
  });

  it('no envía el formulario si es inválido', async () => {
    const itemsSvc = TestBed.inject(ItemsService) as jasmine.SpyObj<ItemsService>;
    component.enviar();
    expect(itemsSvc.crearItem).not.toHaveBeenCalled();
  });
});

describe('ItemFormComponent — modo edición', () => {
  let component: ItemFormComponent;
  let itemsSvc: jasmine.SpyObj<ItemsService>;

  beforeEach(async () => {
    ({ component, itemsSvc } = await setupComponent('1'));
  });

  it('carga los datos del item y deshabilita el campo tipo', () => {
    expect(component.form.get('nombre')?.value).toBe('Leche Entera');
    expect(component.form.get('tipo')?.disabled).toBeTrue();
  });

  it('deja el código editable cuando esta_en_uso=false', () => {
    expect(component.form.get('codigo')?.disabled).toBeFalse();
  });

  it('unidadCambio() detecta cambio de unidad de medida respecto al item cargado', () => {
    expect(component.unidadCambio()).toBeFalse();
    component.form.patchValue({ unidad_medida_id: 99 });
    expect(component.unidadCambio()).toBeTrue();
  });

  it('enviar() abre el modal de confirmación si cambia la unidad de medida, sin llamar al servicio', () => {
    component.form.patchValue({ unidad_medida_id: 99 });
    component.enviar();

    expect(component.mostrarModalUnidad()).toBeTrue();
    expect(itemsSvc.editarItem).not.toHaveBeenCalled();
  });

  it('confirmarCambioUnidad() envía confirmar_cambio_unidad=true', () => {
    itemsSvc.editarItem.and.returnValue(of(itemEjemplo));
    component.form.patchValue({ unidad_medida_id: 99 });
    component.enviar();
    component.confirmarCambioUnidad();

    expect(itemsSvc.editarItem).toHaveBeenCalledWith(
      1,
      jasmine.objectContaining({ confirmar_cambio_unidad: true, unidad_medida_id: 99 }),
    );
  });
});

describe('ItemFormComponent — código bloqueado por uso', () => {
  it('deshabilita el campo código cuando esta_en_uso=true', async () => {
    const { component } = await setupComponent('1', { ...itemEjemplo, esta_en_uso: true });
    expect(component.form.get('codigo')?.disabled).toBeTrue();
  });
});

describe('ItemFormComponent — costos por tienda (rol admin, modo edición)', () => {
  let fixture: ComponentFixture<ItemFormComponent>;
  let component: ItemFormComponent;
  let itemsSvc: jasmine.SpyObj<ItemsService>;
  let tiendasSvc: jasmine.SpyObj<TiendasService>;

  beforeEach(async () => {
    ({ fixture, component, itemsSvc, tiendasSvc } = await setupComponent('1', itemEjemplo, 'admin'));
  });

  it('carga el historial de costos por tienda y la lista de tiendas activas', () => {
    expect(itemsSvc.obtenerCostosTienda).toHaveBeenCalledWith(1);
    expect(tiendasSvc.listar).toHaveBeenCalledWith('activo', 1, 200);
    expect(component.costosPorTienda().length).toBe(1);
    expect(component.costoVigenteDeTienda(1)).toBe(3600);
  });

  it('muestra la sección "Costos por tienda" dentro del mismo formulario', () => {
    expect(fixture.nativeElement.textContent).toContain('Costos por tienda');
  });

  it('registrarCosto() llama a registrarCostoTienda() con los valores del formulario', () => {
    itemsSvc.registrarCostoTienda.and.returnValue(of({
      id: 6, item_id: 1, tienda_id: 1, costo_unitario: 3700,
      vigente_desde: '2026-05-25T09:00:00', creado_por: 1, creado_en: '2026-05-25T09:00:00',
    }));
    component.costoForm.setValue({ tienda_id: 1, costo_unitario: 3700 });
    component.registrarCosto();

    expect(itemsSvc.registrarCostoTienda).toHaveBeenCalledWith(1, { tienda_id: 1, costo_unitario: 3700 });
  });
});

describe('ItemFormComponent — rol no admin', () => {
  let fixture: ComponentFixture<ItemFormComponent>;
  let itemsSvc: jasmine.SpyObj<ItemsService>;

  beforeEach(async () => {
    ({ fixture, itemsSvc } = await setupComponent('1', itemEjemplo, 'barista'));
  });

  it('no carga el historial de costos por tienda', () => {
    expect(itemsSvc.obtenerCostosTienda).not.toHaveBeenCalled();
  });

  it('no muestra la sección "Costos por tienda"', () => {
    expect(fixture.nativeElement.textContent).not.toContain('Costos por tienda');
  });
});
