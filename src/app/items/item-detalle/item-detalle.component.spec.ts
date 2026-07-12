import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { ItemDetalleComponent } from './item-detalle.component';
import { HistorialCostosResponse, ItemDetalle, ItemsService } from '../items.service';
import { TiendasService, ListaTiendasResponse } from '../../tiendas/tiendas.service';
import { AuthService } from '../../auth/auth.service';

const itemEjemplo: ItemDetalle = {
  id: 1,
  codigo: 'LEC-001',
  nombre: 'Leche Entera',
  tipo: 'insumo',
  subcategoria_id: 3,
  subcategoria_nombre: 'Lácteos > Líquidos',
  proveedor_id: 2,
  proveedor_nombre: 'Distribuidora Norte',
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
      historial: [
        { id: 5, costo_unitario: 3600, vigente_desde: '2026-05-20T09:00:00', creado_por: 1, creado_en: '2026-05-20T09:00:00' },
      ],
    },
  ],
};

const tiendasVacio: ListaTiendasResponse = { datos: [], total: 0, pagina: 1, limite: 200 };

function mockRoute(id: string) {
  return { snapshot: { paramMap: { get: () => id } } };
}

async function setupComponent(rol: string) {
  const itemsSvc = jasmine.createSpyObj<ItemsService>('ItemsService', [
    'obtenerItem', 'obtenerCostosTienda', 'registrarCostoTienda', 'inactivarItem', 'reactivarItem',
  ]);
  itemsSvc.obtenerItem.and.returnValue(of(itemEjemplo));
  itemsSvc.obtenerCostosTienda.and.returnValue(of(historialEjemplo));

  const tiendasSvc = jasmine.createSpyObj<TiendasService>('TiendasService', ['listar']);
  tiendasSvc.listar.and.returnValue(of(tiendasVacio));

  await TestBed.configureTestingModule({
    imports: [ItemDetalleComponent],
    providers: [
      provideRouter([]),
      { provide: ItemsService, useValue: itemsSvc },
      { provide: TiendasService, useValue: tiendasSvc },
      { provide: AuthService, useValue: { sesion: () => ({ rol, tienda_id: null }) } },
      { provide: ActivatedRoute, useValue: mockRoute('1') },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(ItemDetalleComponent);
  const component = fixture.componentInstance;
  fixture.detectChanges();

  return { fixture, component, itemsSvc, tiendasSvc };
}

describe('ItemDetalleComponent — rol admin', () => {
  let fixture: ComponentFixture<ItemDetalleComponent>;
  let component: ItemDetalleComponent;
  let itemsSvc: jasmine.SpyObj<ItemsService>;

  beforeEach(async () => {
    ({ fixture, component, itemsSvc } = await setupComponent('admin'));
  });

  it('debe crearse y cargar el item', () => {
    expect(component).toBeTruthy();
    expect(component.item()?.codigo).toBe('LEC-001');
  });

  it('carga el historial de costos por tienda para admin', () => {
    expect(itemsSvc.obtenerCostosTienda).toHaveBeenCalledWith(1);
    expect(component.costosPorTienda().length).toBe(1);
    expect(component.costoVigenteDeTienda(1)).toBe(3600);
  });

  it('muestra la sección "Costos por tienda" en el DOM', () => {
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

describe('ItemDetalleComponent — rol no admin', () => {
  let fixture: ComponentFixture<ItemDetalleComponent>;
  let itemsSvc: jasmine.SpyObj<ItemsService>;

  beforeEach(async () => {
    ({ fixture, itemsSvc } = await setupComponent('barista'));
  });

  it('no carga el historial de costos por tienda', () => {
    expect(itemsSvc.obtenerCostosTienda).not.toHaveBeenCalled();
  });

  it('no muestra la sección "Costos por tienda" en el DOM', () => {
    expect(fixture.nativeElement.textContent).not.toContain('Costos por tienda');
  });

  it('sí muestra los atributos generales del item', () => {
    expect(fixture.nativeElement.textContent).toContain('LEC-001');
  });
});
