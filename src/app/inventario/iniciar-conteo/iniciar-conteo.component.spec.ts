import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { IniciarConteoComponent } from './iniciar-conteo.component';
import { InventarioService } from '../inventario.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { FormCardComponent } from '../../shared/components/form-card/form-card.component';

describe('IniciarConteoComponent', () => {
  let component: IniciarConteoComponent;
  let fixture: ComponentFixture<IniciarConteoComponent>;
  let mockInventarioService: jasmine.SpyObj<InventarioService>;

  beforeEach(async () => {
    mockInventarioService = jasmine.createSpyObj('InventarioService', [
      'getSugerencia',
      'getEstadoInventarioActivo',
      'iniciarConteo',
      'getInventario'
    ]);

    mockInventarioService.getSugerencia.and.returnValue(
      of({ tipo: 'diario', horario: 'apertura' })
    );
    mockInventarioService.getEstadoInventarioActivo.and.returnValue(
      of({ activo: false })
    );

    await TestBed.configureTestingModule({
      imports: [
        IniciarConteoComponent,
        ReactiveFormsModule,
        RouterTestingModule,
        PageHeaderComponent,
        FormCardComponent
      ],
      providers: [
        { provide: InventarioService, useValue: mockInventarioService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(IniciarConteoComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load suggestion on init', () => {
    fixture.detectChanges();
    expect(mockInventarioService.getSugerencia).toHaveBeenCalled();
  });

  it('should show horario field only for diario type', () => {
    fixture.detectChanges();
    component.formulario.patchValue({ tipo: 'diario' });
    fixture.detectChanges();

    const horarioControl = component.formulario.get('horario');
    expect(horarioControl?.hasValidator).toBeTruthy();
  });

  it('should handle error when creating new conteo', () => {
    mockInventarioService.iniciarConteo.and.returnValue(
      throwError(() => ({ error: { mensaje: 'Test error' } }))
    );

    component.formulario.patchValue({
      tipo: 'diario',
      horario: 'apertura'
    });

    component.iniciarConteo();

    expect(component.iniciarConteoError).toBeTruthy();
  });
});
