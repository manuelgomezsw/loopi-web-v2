import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { AuthService } from '../../../auth/auth.service';
import { StoreContextService } from '../../services/store-context.service';
import { SidebarComponent } from './sidebar/sidebar.component';
import { TopbarComponent } from './topbar/topbar.component';

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
}
