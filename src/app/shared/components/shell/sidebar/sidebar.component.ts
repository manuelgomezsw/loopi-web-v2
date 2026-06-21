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

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent {
  private readonly navConfig = inject(NavConfigService);

  @Input() isOpen = false;
  @Output() closed = new EventEmitter<void>();

  readonly navItems = this.navConfig.navItems;

  trackById(_index: number, item: NavItem): string {
    return item.id;
  }

  cerrar(): void {
    this.closed.emit();
  }

  /** Placeholder de ícono hasta integrar librería SVG (ej. Heroicons). */
  iconEmoji(icon: string): string {
    const map: Record<string, string> = {
      'home': '⊞',
      'building-storefront': '🏪',
      'users': '👥',
      'squares-2x2': '⊡',
      'book-open': '📖',
      'clipboard-document-list': '📋',
      'trash': '🗑',
      'shopping-cart': '🛒',
      'banknotes': '💵',
      'chart-bar': '📊',
      'presentation-chart-line': '📈',
    };
    return map[icon] ?? '●';
  }
}
