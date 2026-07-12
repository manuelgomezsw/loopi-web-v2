import { TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { ItemFormComponent } from './item-form.component';
import { ItemDetalle, ItemsService } from '../items.service';
import { CategoriasService, CatalogoResponse } from '../../categorias/categorias.service';
import { ProveedoresService, ListarProveedoresResponse } from '../../proveedores/proveedores.service';
import { UnidadesMedidaService, ListarUnidadesMedidaResponse } from '../../unidades-medida/unidades-medida.service';

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

function mockRoute(id: string | null) {
  return { snapshot: { paramMap: { get: () => id } } };
}

async function setupComponent(idParam: string | null, itemMock: ItemDetalle = itemEjemplo) {
  const itemsSvc = jasmine.createSpyObj<ItemsService>('ItemsService', ['crearItem', 'obtenerItem', 'editarItem', 'inactivarItem', 'reactivarItem']);
  if (idParam) itemsSvc.obtenerItem.and.returnValue(of(itemMock));

  const categoriasSvc = jasmine.createSpyObj<CategoriasService>('CategoriasService', ['obtenerCatalogo']);
  categoriasSvc.obtenerCatalogo.and.returnValue(of(catalogoVacio));

  const proveedoresSvc = jasmine.createSpyObj<ProveedoresService>('ProveedoresService', ['listar']);
  proveedoresSvc.listar.and.returnValue(of(proveedoresVacio));

  const unidadesSvc = jasmine.createSpyObj<UnidadesMedidaService>('UnidadesMedidaService', ['listar']);
  unidadesSvc.listar.and.returnValue(of(unidadesVacio));

  await TestBed.configureTestingModule({
    imports: [ItemFormComponent],
    providers: [
      provideRouter([]),
      { provide: ItemsService, useValue: itemsSvc },
      { provide: CategoriasService, useValue: categoriasSvc },
      { provide: ProveedoresService, useValue: proveedoresSvc },
      { provide: UnidadesMedidaService, useValue: unidadesSvc },
      { provide: ActivatedRoute, useValue: mockRoute(idParam) },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(ItemFormComponent);
  const component = fixture.componentInstance;
  fixture.detectChanges();

  return { fixture, component, itemsSvc };
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
