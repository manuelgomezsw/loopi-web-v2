import { Injectable, computed, signal } from '@angular/core';

import { FormMode } from '../models/filter.model';

@Injectable()
export class FormModeService {
  readonly mode = signal<FormMode>('create');
  readonly isEdit = computed(() => this.mode() === 'edit');
  readonly isCreate = computed(() => this.mode() === 'create');
}
