import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InventarioDetalleComponent } from './inventario-detalle.component';
import { InventarioService, InventarioResp, ItemDetailResp } from './inventario.service';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

const mockInventario: InventarioResp = {
  id: 1,
  tienda_id: 1,
  fecha: '2026-07-12',
  tipo: 'diario',
  horario: 'apertura',
  estado: 'en_progreso',
  responsable_id: 1,
  iniciado_en: '2026-07-12T10:00:00Z',
  completado_en: undefined,
  items: [
    {
      id: 1,
      item_id: 1,
      valor_sugerido: 10,
      valor_esperado: 10,
      valor_real: undefined,
      diferencia: undefined
    }
  ]
};

const mockItemResp: ItemDetailResp = {
  id: 1,
  item_id: 1,
  valor_sugerido: 10,
  valor_esperado: 10,
  valor_real: 15.5,
  diferencia: 5.5
};

describe('InventarioDetalleComponent', () => {
  let component: InventarioDetalleComponent;
  let fixture: ComponentFixture<InventarioDetalleComponent>;
  let inventarioService: jasmine.SpyObj<InventarioService>;

  beforeEach(async () => {
    const serviceSpy = jasmine.createSpyObj('InventarioService', [
      'getInventario',
      'registrarValorReal',
      'eliminarConteo'
    ]);

    await TestBed.configureTestingModule({
      imports: [InventarioDetalleComponent],
      providers: [
        { provide: InventarioService, useValue: serviceSpy },
        {
          provide: ActivatedRoute,
          useValue: { params: of({ id: '1' }) }
        }
      ]
    }).compileComponents();

    inventarioService = TestBed.inject(InventarioService) as jasmine.SpyObj<InventarioService>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InventarioDetalleComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should cargar detalle on init', () => {
    inventarioService.getInventario.and.returnValue(of(mockInventario));

    component.cargarDetalle(1);

    expect(inventarioService.getInventario).toHaveBeenCalledWith(1);
    expect(component.inventario).toEqual(mockInventario);
  });

  it('should toggle edit mode', () => {
    component.editando = false;
    component.toggleEditMode();
    expect(component.editando).toBeTruthy();

    component.toggleEditMode();
    expect(component.editando).toBeFalsy();
  });

  it('should marcar item editado', () => {
    component.marcarItemEditado(1);
    expect(component.itemsEditados.has(1)).toBeTruthy();
  });

  it('should guardar cambios for edited items', () => {
    component.inventario = {
      ...mockInventario,
      items: [{ ...mockItemResp, valor_real: 15.5, diferencia: 5.5 }]
    };
    component.itemsEditados.add(1);

    inventarioService.registrarValorReal.and.returnValue(of(mockItemResp));

    component.guardarCambios();

    expect(inventarioService.registrarValorReal).toHaveBeenCalled();
  });

  it('should cancelar edicion', () => {
    component.editando = true;
    component.inventario = mockInventario;

    inventarioService.getInventario.and.returnValue(of(mockInventario));

    component.cancelarEdicion();

    expect(component.editando).toBeFalsy();
  });

  it('should eliminar conteo with confirmation', () => {
    component.inventario = { ...mockInventario, estado: 'en_progreso' };

    inventarioService.eliminarConteo.and.returnValue(of(void 0));
    spyOn(window, 'confirm').and.returnValue(true);

    component.eliminarConteo();

    expect(inventarioService.eliminarConteo).toHaveBeenCalledWith(1);
  });

  it('should not eliminar if not en_progreso', () => {
    component.inventario = { ...mockInventario, estado: 'completado' };

    component.eliminarConteo();

    expect(component.errorEliminar).toContain('progreso');
  });

  it('should puedeEditarCompletado only for admin + completado', () => {
    component.userRole = 'admin';
    component.inventario = { ...mockInventario, estado: 'completado' };

    expect(component.puedeEditarCompletado()).toBeTruthy();

    component.userRole = 'barista';
    expect(component.puedeEditarCompletado()).toBeFalsy();
  });

  it('should puedeEliminar only for admin + en_progreso', () => {
    component.userRole = 'admin';
    component.inventario = { ...mockInventario, estado: 'en_progreso' };

    expect(component.puedeEliminar()).toBeTruthy();

    component.inventario = { ...mockInventario, estado: 'completado' };
    expect(component.puedeEliminar()).toBeFalsy();
  });
});
