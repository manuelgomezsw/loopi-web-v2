import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { CompletarConteoComponent } from './completar-conteo.component';
import { CompletarConteoService } from './completar-conteo.service';

describe('CompletarConteoComponent', () => {
  let component: CompletarConteoComponent;
  let fixture: ComponentFixture<CompletarConteoComponent>;
  let service: CompletarConteoService;

  beforeEach(async () {
    await TestBed.configureTestingModule({
      imports: [CompletarConteoComponent, HttpClientTestingModule],
      providers: [
        CompletarConteoService,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => (key === 'id' ? '1' : null),
              },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CompletarConteoComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(CompletarConteoService);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // TODO: T065-T067 — Escribir tests completos
  // - Test init y load inventario
  // - Test confirmar success
  // - Test confirmar error (422, 403, 404, 409)
  // - Test navigation después de confirmar
});
