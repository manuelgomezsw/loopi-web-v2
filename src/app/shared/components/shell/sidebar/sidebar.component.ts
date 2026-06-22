import {
  Component,
  Input,
  Output,
  EventEmitter,
  inject,
  signal,
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

  private readonly expandedIds = signal<Set<string>>(new Set());

  trackById(_index: number, item: NavItem): string {
    return item.id;
  }

  isExpanded(id: string): boolean {
    return this.expandedIds().has(id);
  }

  toggleExpanded(id: string): void {
    this.expandedIds.update((set) => {
      const next = new Set(set);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  cerrar(): void {
    this.closed.emit();
  }
}
