import { Injectable } from '@angular/core';

import { ActiveFilters } from '../models/filter.model';

@Injectable({ providedIn: 'root' })
export class FilterStateService {
  private readonly store = new Map<string, ActiveFilters>();

  get(key: string): ActiveFilters {
    return this.store.get(key) ?? {};
  }

  set(key: string, filters: ActiveFilters): void {
    this.store.set(key, { ...filters });
  }
}
