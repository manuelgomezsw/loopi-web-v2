import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';

import { LoginComponent } from './login.component';
import { AuthService } from '../auth.service';
import { HttpErrorResponse } from '@angular/common/http';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['login', 'logout', 'getMe', 'estaAutenticado']);

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: AuthService, useValue: authServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: { get: () => null } } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('el botón debe estar deshabilitado si el formulario es inválido', () => {
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('button[type="submit"]');
    expect(btn.disabled).toBeTrue();
  });

  it('el botón debe habilitarse cuando usuario y contraseña tienen valor', () => {
    component.form.setValue({ usuario: 'ana', contrasena: 'secret' });
    fixture.detectChanges();
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('button[type="submit"]');
    expect(btn.disabled).toBeFalse();
  });

  it('debe mostrar mensaje genérico en error 401', () => {
    authServiceSpy.login.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 401 })),
    );

    component.form.setValue({ usuario: 'ana', contrasena: 'wrong' });
    component.onSubmit();
    fixture.detectChanges();

    const error: HTMLElement | null = fixture.nativeElement.querySelector('.error-message');
    expect(error).toBeTruthy();
    expect(error!.textContent).toContain('Usuario o contraseña incorrectos');
  });

  it('debe mostrar mensaje de cuenta bloqueada en error 423', () => {
    authServiceSpy.login.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 423 })),
    );

    component.form.setValue({ usuario: 'bloqueado', contrasena: 'any' });
    component.onSubmit();
    fixture.detectChanges();

    const error: HTMLElement | null = fixture.nativeElement.querySelector('.error-message');
    expect(error).toBeTruthy();
    expect(error!.textContent).toContain('bloqueada temporalmente');
  });

  it('debe deshabilitar el botón mientras el request está en vuelo', () => {
    authServiceSpy.login.and.returnValue(of({ rol: 'barista', tienda_id: 1 }));

    component.form.setValue({ usuario: 'ana', contrasena: 'pass' });
    component.cargando = true;
    fixture.detectChanges();

    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('button[type="submit"]');
    expect(btn.disabled).toBeTrue();
  });

  it('no debe hacer el submit si el formulario es inválido', () => {
    component.onSubmit();
    expect(authServiceSpy.login).not.toHaveBeenCalled();
  });
});
