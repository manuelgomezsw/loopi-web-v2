import { Component } from '@angular/core';

@Component({
  selector: 'app-forbidden',
  standalone: true,
  template: `
    <div class="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <h1 class="text-2xl font-semibold text-gray-800">No tienes permiso para ver esto</h1>
      <p class="text-gray-500">Contacta al administrador si crees que esto es un error.</p>
      <button
        type="button"
        class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        (click)="volver()"
      >
        Volver
      </button>
    </div>
  `,
})
export class ForbiddenComponent {
  volver(): void {
    window.history.back();
  }
}
