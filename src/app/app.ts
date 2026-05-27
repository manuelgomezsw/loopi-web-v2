import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { AuthService } from './auth/auth.service';

/**
 * Componente raíz de la aplicación.
 * En ngOnInit llama a getMe() para restaurar la sesión en memoria cuando el usuario
 * recarga la página con una cookie jwt activa (HU4 — RF-AUTH-04).
 * Los errores 401 los gestiona authInterceptor redirigiendo al /login.
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  private readonly auth = inject(AuthService);

  ngOnInit(): void {
    // Restaurar sesión desde cookie activa. authInterceptor gestiona el 401.
    this.auth.getMe().subscribe({ error: () => {} });
  }
}
