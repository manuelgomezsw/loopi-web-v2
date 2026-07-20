import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';

import { CompletarConteoComponent } from './completar-conteo.component';
import { CompletarConteoService } from './completar-conteo.service';

describe('CompletarConteoComponent', () => {
  let component: CompletarConteoComponent;
  let fixture: ComponentFixture<CompletarConteoComponent>;
  let service: CompletarConteoService;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
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
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(CompletarConteoComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(CompletarConteoService);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // TODO: T065-T067 — Escribir tests completos
});
