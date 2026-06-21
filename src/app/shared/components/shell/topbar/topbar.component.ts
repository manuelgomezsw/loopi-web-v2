import {
  Component,
  Input,
  Output,
  EventEmitter,
  inject,
  computed,
} from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { Router } from '@angular/router';

import { AuthService } from '../../../../auth/auth.service';
import { StoreContextService } from '../../../services/store-context.service';
import { StoreSelectorComponent } from '../store-selector/store-selector.component';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [StoreSelectorComponent, TitleCasePipe],
  templateUrl: './topbar.component.html',
})
export class TopbarComponent {
  private readonly auth = inject(AuthService);
  private readonly storeCtx = inject(StoreContextService);
  private readonly router = inject(Router);

  @Input() sidebarOpen = false;
  @Output() menuToggled = new EventEmitter<void>();

  readonly sesion = this.auth.sesion;
  readonly esAdmin = computed(() => this.sesion()?.rol === 'admin');

  readonly contextoTienda = this.storeCtx.context;

  toggleMenu(): void {
    this.menuToggled.emit();
  }

  cerrarSesion(): void {
    this.auth.logout().subscribe({
      complete: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login']),
    });
  }
}
