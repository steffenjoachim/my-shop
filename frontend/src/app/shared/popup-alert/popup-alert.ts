import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-popup-alert',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    @if (visible) {
    <div class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
      <div
        class="bg-white border rounded-lg shadow-xl p-6 max-w-sm w-full text-center"
        [ngClass]="{
          'border-green-500 text-green-700': type === 'success',
          'border-red-500 text-red-700': type === 'error',
          'border-blue-500 text-blue-700': type === 'info'
        }"
      >
        <div class="flex flex-col items-center gap-4">
          <span [innerHTML]="message" class="text-lg font-medium"></span>
          <button
            class="px-4 py-2 bg-green-700 rounded text-white cursor-pointer hover:bg-green-800 transition"
            (click)="visible = false"
            routerLink="/"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
    }
  `,
  styles: [],
})
export class PopupAlert {
  @Input() message = '';
  @Input() type: 'success' | 'error' | 'info' = 'info';
  @Input() visible = false;
}
