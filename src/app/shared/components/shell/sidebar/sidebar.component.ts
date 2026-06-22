import {
  Component,
  Input,
  Output,
  EventEmitter,
  inject,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { NavConfigService } from '../../../services/nav-config.service';
import { NavItem } from '../../../models/nav.types';
import { IconComponent } from '../../icon/icon.component';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, IconComponent],
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent {
  private readonly navConfig = inject(NavConfigService);

  @Input() isOpen = false;
  @Input() collapsed = false;
  @Output() closed = new EventEmitter<void>();
  @Output() collapseToggled = new EventEmitter<void>();

  readonly navItems = this.navConfig.navItems;

  trackById(_index: number, item: NavItem): string {
    return item.id;
  }

  cerrar(): void {
    this.closed.emit();
  }
}
