import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';

import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
})
export class LoginComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  form = this.fb.nonNullable.group({
    usuario: ['', Validators.required],
    contrasena: ['', Validators.required],
  });

  /** Mensaje de error para el usuario (null = sin error). */
  errorMensaje: string | null = null;

  /** Mensaje informativo (ej. sesión expirada — HU5). */
  infoMensaje: string | null = null;

  ngOnInit(): void {
    // HU5: mostrar aviso si el interceptor redirigió por sesión expirada.
    if (this.route.snapshot.queryParamMap.get('motivo') === 'sesion_expirada') {
      this.infoMensaje = 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.';
    }
  }

  /** true mientras el request está en vuelo (deshabilita el botón). */
  cargando = false;

  onSubmit(): void {
    if (this.form.invalid || this.cargando) {
      return;
    }

    this.errorMensaje = null;
    this.cargando = true;

    const { usuario, contrasena } = this.form.getRawValue();

    this.auth.login(usuario, contrasena).subscribe({
      next: () => {
        this.cargando = false;
        this.router.navigate(['/']);
      },
      error: (err: HttpErrorResponse) => {
        this.cargando = false;
        this.errorMensaje = this.mensajeDeError(err);
      },
    });
  }

  private mensajeDeError(err: HttpErrorResponse): string {
    if (err.status === 423) {
      return 'Tu cuenta está bloqueada temporalmente por demasiados intentos fallidos. Intenta en 5 minutos.';
    }
    // 401, 400, o cualquier otro error — mensaje genérico (no revela si el usuario existe).
    return 'Usuario o contraseña incorrectos.';
  }
}
