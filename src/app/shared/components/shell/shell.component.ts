import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { AuthService } from '../../../auth/auth.service';
import { StoreContextService } from '../../services/store-context.service';
import { SidebarComponent } from './sidebar/sidebar.component';
import { TopbarComponent } from './topbar/topbar.component';

const STORAGE_KEY = 'loopi_sidebar_collapsed';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, TopbarComponent],
  templateUrl: './shell.component.html',
})
export class ShellComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly storeCtx = inject(StoreContextService);

  readonly sidebarOpen = signal(false);

  readonly sidebarCollapsed = signal<boolean>(
    (() => {
      try {
        return localStorage.getItem(STORAGE_KEY) === 'true';
      } catch {
        return false;
      }
    })()
  );

  ngOnInit(): void {
    const sesion = this.auth.sesion();
    if (sesion) {
      this.storeCtx.initFromSession(sesion);
    }
  }

  toggleSidebar(): void {
    this.sidebarOpen.update((v) => !v);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  toggleCollapse(): void {
    const next = !this.sidebarCollapsed();
    this.sidebarCollapsed.set(next);
    try {
      localStorage.setItem(STORAGE_KEY, String(next));
    } catch { /* localStorage no disponible — estado en memoria únicamente */ }
  }
}
